import uuid
from typing import Any

from fastapi import HTTPException
from langchain.agents import create_agent
from langchain_core.messages import ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import settings
from lib.mcp_tools import McpTools
from schemas.chat_schema import ChatResponse
from schemas.llm_response_schema import LlmResponse, RouterResponse


class CatAgentService:
    def __init__(self):
        model = ChatGoogleGenerativeAI(
            **settings.main_llm_config, google_api_key=settings.google_api_key
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

        The server will attach used_tools, tool_data, and search_sources from tool output.
        Focus on writing a clear, accurate chat_reply.
        """

        self.no_search_system_prompt = """
        You are Cat Care Agent. Answer in Korean.

        Rules:
        - Answer from established cat care knowledge only.
        - Do NOT claim you searched the web.
        - Do NOT provide product purchase links or current prices.
        - If the user asks for shopping links, live prices, or latest news,
        say that a web search is required and you cannot provide verified links
        in this mode. (In practice, router should send those to search agent;
        this is a safety net.)

        - Urgent symptoms → recommend vet immediately.
        - Do not diagnose with certainty.
        - Do not expose chain-of-thought.

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
        # tavily_tools = await McpTools().get_tavily_tools()
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

        for _ in range(1):  # 최초 1회 + 재시도 1회
            try:
                result = await cat_agent.ainvoke(
                    {"messages": [{"role": "user", "content": user_input}]}
                )
                _used_tools = self._parse_llm_messages(result.get("messages"))

                structured = result.get("structured_response")

                if structured is None:
                    raise ValueError("Missing structured_response")
                if isinstance(structured, ChatResponse):
                    return structured.model_copy(update={"session_id": session_id})
                if isinstance(structured, dict):
                    return ChatResponse.model_validate({**structured, "session_id": session_id})

                raise ValueError("structured_response must be ChatResponse or dict")
            except Exception as exc:
                last_error = exc

        raise HTTPException(
            status_code=502,
            detail=f"Upstream model returned an invalid structured response: {last_error}",
        )

    def create_session_id(self) -> str:
        return str(uuid.uuid4())

    def _parse_llm_messages(self, chat_reply: str, messages: list[Any]) -> list[ToolMessage]:
        return [
            m for m in messages if isinstance(m, ToolMessage) and m.name != LlmResponse.__name__
        ]


cat_agent = CatAgentService()
