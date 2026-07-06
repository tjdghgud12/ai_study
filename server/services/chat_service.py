import json
import re
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import HTTPException
from langchain.agents import create_agent
from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from redis import Redis
from sqlalchemy import func, insert, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from lib.mcp_tools import McpTools
from lib.security import decode_access_token
from models.messages_model import Messages
from models.sessions_model import Sessions
from repositories.messages_repository import get_messages_data
from repositories.sessions_repository import get_sessions_data
from schemas.chat_schema import (
    ChatResponse,
    ChatStreamDelta,
    ChatStreamDone,
    ChatStreamError,
    ChatStreamNewSession,
    MessageResponse,
    SessionResponse,
)
from schemas.llm_response_schema import LlmResponse, RouterResponse


class CatAgentService:
    ANCHOR_PATTERN = re.compile(r"\{\{\{([^|]+)\|([^}]+)\}\}\}")
    BARE_URL_PATTERN = re.compile(r'https?://[^\s\]\)\'"<>]+')

    def __init__(self):
        model = ChatGoogleGenerativeAI(
            **settings.main_llm_config,
            google_api_key=settings.google_api_key,
            streaming=True,
        )
        self.llm = model
        self.router_llm = ChatGoogleGenerativeAI(
            **settings.router_llm_config, google_api_key=settings.google_api_key
        )

        self.search_system_prompt = """
        You are Cat Care Agent with web search. Answer in Korean.

        Mandatory:
        1. You MUST call search tool before answering.
        Do not answer from memory for facts that require live web data.
        2. In chat_reply, only mention URLs, product names, and prices
        that appear in the tool response (grounding/sources).
        3. If the tool returns fewer items than requested, say how many were found
        and do not invent the rest.
        4. Prefer authoritative sources for health topics (vets, official orgs).
        5. For shopping requests, list items with title and URL from tool results.
        6. Do not expose chain-of-thought.
        7. If chat_reply contains any URL, it MUST use anchor token format.
        8. Write chat_reply in clean Markdown (headings/lists/code blocks when helpful).

        URL Anchor Token Rules:
        - Every URL must be wrapped in this exact format: {{{title|url}}}
            - title: tool response에서 가져온 원본 title
            - url: tool response에서 가져온 정확한 URL

        - Examples (title must be the exact "title" field from tool results, not your summary):
        ✅ {{{Cat Food: Best Cat Food from Top Brands on Chewy|https://www.chewy.com/b/food-387}}}
        ❌ {{{고양이 사료 추천|https://www.chewy.com/b/food-387}}}  (paraphrased title)
        ❌ https://example.com/cat-supplement
        ❌ [고양이 영양제 추천](https://example.com/cat-supplement)

        - Never use bare URLs (https://...) outside of anchor tokens.
        - Never use markdown link format [text](url).
        - Never fabricate URLs. Only use URLs that appear in tool response.
        - Violation of these rules will result in your entire response being discarded.

        The server will attach used_tools, tool_data, and search_sources from tool output.
        Focus on writing a clear, accurate chat_reply.
        """

        self.no_search_system_prompt = """
        You are Cat Care Agent. Answer in Korean.

        Rules:
        - Answer from established cat care knowledge only.
        - Do NOT claim you searched the web.

        - Urgent symptoms → recommend vet immediately.
        - Do not diagnose with certainty.
        - Do not expose chain-of-thought.
        - Write chat_reply in clean Markdown (headings/lists/code blocks when helpful).

        Output chat_reply only (other fields are filled by the server).
        """

        self.router_system_prompt = """
        You are the routing classifier for a Cat Care Agent.
        Your only job is to decide whether the user's message requires live web search.

        Output use_search_tool only (structured). Do not answer the user.

        Set use_search_tool=true when the message needs current or verifiable web data, including:
        - Product recommendations, shopping links, prices, or where to buy
        - Latest news, recalls, new products, or time-sensitive facts
        - Comparisons that depend on currently available items or recent information
        - Requests for URLs, sources, or "search/find/look up" style questions
        - Anything where a stale or generic answer could be wrong or unhelpful

        Set use_search_tool=false when general cat-care knowledge is enough, including:
        - Basic care, behavior, training, grooming, litter box habits
        - General diet or health guidance without specific products or current prices
        - Common symptom context and when to see a vet (without needing latest news)
        - Definitions, explanations, and how-to questions with stable answers

        When uncertain, prefer use_search_tool=true.
        """

    async def create_cat_agent(self):
        brave_tools = await McpTools().get_brave_tools()
        self._search_agent = create_agent(
            model=self.llm,
            tools=brave_tools,
            system_prompt=self.search_system_prompt,
            response_format=LlmResponse,
        )
        self._no_search_agent = create_agent(
            model=self.llm,
            system_prompt=self.no_search_system_prompt,
            response_format=LlmResponse,
        )
        self._router_agent = create_agent(
            model=self.router_llm,
            system_prompt=self.router_system_prompt,
            response_format=RouterResponse,
        )
        # structured output 사용 시 Gemini는 토큰 스트림 대신 마지막 ToolMessage로만 응답함
        self._search_stream_agent = create_agent(
            model=self.llm,
            tools=brave_tools,
            system_prompt=self.search_system_prompt,
        )
        self._no_search_stream_agent = create_agent(
            model=self.llm,
            system_prompt=self.no_search_system_prompt,
        )

    async def ask_question(self, user_input: str, session_id: str | None = None) -> ChatResponse:
        last_error: Exception | None = None

        if session_id is None:
            session_id = self.create_session_id()

        need_search = await self._router_agent.ainvoke(
            {"messages": [{"role": "user", "content": user_input}]}
        )

        cat_agent = (
            self._search_agent
            if need_search.get("structured_response").use_search_tool
            else self._no_search_agent
        )

        for _ in range(3):  # 최초 1회 + 재시도 1회
            try:
                result = await cat_agent.ainvoke(
                    {"messages": [{"role": "user", "content": user_input}]}
                )

                structured_response = result.get("structured_response")

                if self._filter_chat_reply_not_allow_url(structured_response.chat_reply):
                    continue
                if structured_response is None:
                    raise ValueError("Missing structured_response")
                return_data = self._parse_llm_messages(
                    structured_response.chat_reply, result.get("messages")
                )
                return_data.session_id = session_id

                return return_data

            except Exception as exc:
                last_error = exc

        raise HTTPException(
            status_code=502,
            detail=f"Upstream model returned an invalid structured response: {last_error}",
        )

    async def ask_question_stream(
        self,
        user_input: str,
        db: AsyncSession,
        user_id: str | None = None,
        session_id: str | None = None,
    ) -> AsyncIterator[str]:
        message_id = self.create_message_id()

        if session_id is None:
            session_id = self.create_session_id()
            # Redis 추가 필요
            session_update = (
                (
                    await db.execute(
                        insert(Sessions)
                        .values(
                            user_id=user_id,
                            id=session_id,
                            title=user_input[:50],
                            next_sequence=2,
                        )
                        .returning(Sessions)
                    )
                )
                .scalars()
                .one()
            )

            await db.commit()

            yield (
                ChatStreamNewSession(
                    message_id=message_id,
                    session_id=session_update.id,
                    session_title=session_update.title,
                    created_at=session_update.created_at,
                    updated_at=session_update.updated_at,
                ).model_dump_json(by_alias=True)
                + "\n"
            )
        else:
            # Redis 추가 필요
            session_update = (
                (
                    await db.execute(
                        update(Sessions)
                        .where(
                            Sessions.id == session_id,
                            Sessions.user_id == user_id,
                        )
                        .values(
                            next_sequence=func.coalesce(Sessions.next_sequence, 0) + 2,
                            updated_at=func.now(),
                        )
                        .returning(Sessions)
                    )
                )
                .scalars()
                .one_or_none()
            )

        if session_update is None:
            yield (
                ChatStreamError(
                    message_id=message_id,
                    detail="Session not found",
                ).model_dump_json(by_alias=True)
                + "\n"
            )
            return

        # Redis 추가 필요
        await db.execute(
            insert(Messages).values(
                user_id=user_id,
                session_id=session_id,
                turn_id=message_id,
                role="user",
                sequence=session_update.next_sequence - 2,
                message=user_input,
            )
        )

        need_search = await self._router_agent.ainvoke(
            {"messages": [{"role": "user", "content": user_input}]}
        )
        cat_agent = (
            self._search_stream_agent
            if need_search.get("structured_response").use_search_tool
            else self._no_search_stream_agent
        )

        all_messages: list[Any] = []
        chat_reply = ""

        async for mode, chunk in cat_agent.astream(
            {"messages": [{"role": "user", "content": user_input}]},
            stream_mode=["messages", "updates"],
        ):
            if mode == "messages":
                token, _meta = chunk
                if not isinstance(token, AIMessageChunk):
                    continue
                delta = self._message_content_to_str(token)
                if not delta:
                    continue
                chat_reply += delta
                delta_event = ChatStreamDelta(message_id=message_id, chat_reply=delta)
                yield (delta_event.model_dump_json(by_alias=True) + "\n")
            elif mode == "updates":
                for update_item in chunk.values():
                    if msgs := update_item.get("messages"):
                        all_messages = msgs

        if not chat_reply:
            chat_reply = self._last_ai_reply(all_messages) or ""

        if not chat_reply:
            yield (
                ChatStreamError(
                    message_id=message_id, detail="Upstream model returned an empty response"
                ).model_dump_json(by_alias=True)
                + "\n"
            )
            return

        if self._filter_chat_reply_not_allow_url(chat_reply):
            yield (
                ChatStreamError(
                    message_id=message_id,
                    detail="Response contained bare URLs outside anchor tokens",
                ).model_dump_json(by_alias=True)
                + "\n"
            )
            return

        final = self._parse_llm_messages(chat_reply, all_messages)
        final.session_id = session_update.id

        # Redis 추가 필요
        await db.execute(
            insert(Messages).values(
                user_id=user_id,
                session_id=session_update.id,
                turn_id=message_id,
                role="ai",
                sequence=session_update.next_sequence - 1,
                message=final.chat_reply,
            )
        )

        yield (
            ChatStreamDone(
                **final.model_dump(),
                message_id=message_id,
                title=session_update.title,
                created_at=session_update.created_at,
                updated_at=session_update.updated_at,
            ).model_dump_json(by_alias=True)
            + "\n"
        )

    def create_session_id(self) -> str:
        return str(uuid.uuid4())

    def create_message_id(self) -> str:
        return str(uuid.uuid4())

    def _parse_brave_tool_payload(self, tool: ToolMessage) -> dict[str, Any] | None:
        content = tool.content
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            text = "".join(
                block.get("text", "")
                for block in content
                if isinstance(block, dict) and block.get("type") == "text"
            )
        else:
            return None

        if not text or text.startswith("Error"):
            return None
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None

    def _extract_brave_urls(self, tool: ToolMessage) -> dict[str, str]:
        payload = self._parse_brave_tool_payload(tool)
        if not payload:
            return {}

        url_by_title: dict[str, str] = {}
        for item in payload.get("results") or []:
            title, url = item.get("title"), item.get("url")
            if title and url:
                url_by_title[title] = url

        for url, meta in (payload.get("sources") or {}).items():
            title = (meta or {}).get("title")
            if title and url:
                url_by_title.setdefault(title, url)

        return url_by_title

    def _parse_llm_messages(self, chat_reply: str, messages: list[Any]) -> ChatResponse:
        used_tools = [
            m for m in messages if isinstance(m, ToolMessage) and m.name != LlmResponse.__name__
        ]
        tool_names = []
        tool_data = {}

        for tool in used_tools:
            tool_names.append(tool.name)
            if tool.name == "brave_search":
                url_dict: dict[str, str] = self._extract_brave_urls(tool)
                chat_urls = re.findall(r"\{\{\{([^|]+)\|([^}]+)\}\}\}", chat_reply)
                for title, url in chat_urls:
                    braveUrl = url_dict.get(title)
                    if braveUrl is None:
                        chat_reply = chat_reply.replace(
                            f"{{{{{title}|{url}}}}}", "URL 오류로 인해 삭제되었습니다."
                        )
                    else:
                        chat_reply = chat_reply.replace(
                            f"{{{{{title}|{url}}}}}", f"{{{{{title}|{braveUrl}}}}}"
                        )
                tool_data[tool.name] = url_dict

        chat_reply = chat_reply.replace("{{{", "").replace("}}}", "")

        return ChatResponse(
            session_id="", chat_reply=chat_reply, used_tools=tool_names, tool_data=tool_data
        )

    def _filter_chat_reply_not_allow_url(self, chat_reply: str) -> bool:
        ANCHOR_PATTERN = re.compile(r"\{\{\{([^|]+)\|([^}]+)\}\}\}")
        BARE_URL = re.compile(r'https?://[^\s\]\)\'"<>]+')
        cleaned = ANCHOR_PATTERN.sub("", chat_reply)
        return bool(BARE_URL.search(cleaned))

    @staticmethod
    def _last_ai_reply(messages: list[Any]) -> str | None:
        for message in reversed(messages):
            if not isinstance(message, (AIMessage, AIMessageChunk)):
                continue
            text = CatAgentService._message_content_to_str(message)
            if text:
                return text
        return None

    @staticmethod
    def _message_content_to_str(message: BaseMessage) -> str:
        content = message.content
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "".join(
                block.get("text", "")
                for block in content
                if isinstance(block, dict) and block.get("type") == "text"
            )
        return str(content) if content else ""


async def get_sessions(db: AsyncSession, redis: Redis, token: str) -> list[SessionResponse]:
    user_id = decode_access_token(token)
    sessions = await get_sessions_data(db, redis, user_id)

    return [
        SessionResponse(
            session_id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )
        for session in sessions
    ]


async def get_chat_messages(
    session_id: str, db: AsyncSession, redis: Redis, token: str
) -> list[MessageResponse]:
    user_id = decode_access_token(token)
    messages = await get_messages_data(db, redis, user_id, session_id)
    return [
        MessageResponse(
            message_id=message.turn_id,
            session_id=message.session_id,
            turn_id=message.turn_id,
            role=str(message.role),
            sequence=message.sequence,
            message=message.message,
            created_at=message.created_at,
        )
        for message in messages
    ]


cat_agent = CatAgentService()
