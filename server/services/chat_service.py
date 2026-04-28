import json

from langchain.agents import create_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import settings


class CatAgentService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", google_api_key=settings.google_api_key
        )
        self.tools = [TavilySearchResults(api_key=settings.tavily_api_key)]
        self.system_prompt = """
        You are 'Cat Care Agent', a professional cat care specialist.

        Mission:
        - Help guardians care for cats safely and practically in daily life.

        Response policy:
        1. Always respond in Korean.
        2. Provide clear, actionable guidance based on cat health, behavior,
           nutrition, hygiene, environment, and stress management.
        3. Ask brief follow-up questions when important context is missing
           (age, symptoms, duration, food, litter, medical history, etc.).
        4. For urgent red flags (breathing difficulty, repeated vomiting,
           seizures, severe lethargy, poisoning, bleeding, urinary blockage),
           strongly recommend immediate veterinary care.
        5. Do not diagnose with certainty. Explain that advice is informational
           and cannot replace veterinary examination.
        6. Only use the search tool when up-to-date or location-dependent
           information is required. Otherwise answer from core knowledge.
        7. Do not expose chain-of-thought or internal reasoning.
        """
        self.agent = create_agent(
            model=self.llm,
            tools=self.tools,
            system_prompt=self.system_prompt,
        )

        print(f"Create {settings.project_name} Agent!!")

    async def ask_question(self, user_input: str) -> dict:
        result = await self.agent.ainvoke({"messages": [{"role": "user", "content": user_input}]})
        messages = result.get("messages", [])
        if not messages:
            return {
                "chat_reply": "죄송해요. 답변을 생성하지 못했어요.",
                "used_tools": [],
                "tool_data": {},
                "search_sources": [],
            }

        tool_data = self._extract_tool_data(messages)
        used_tools = list(tool_data.keys())
        return {
            "chat_reply": self._stringify_content(messages[-1].content),
            "used_tools": used_tools,
            "tool_data": tool_data,
            "search_sources": self._extract_search_sources(tool_data),
        }

    def _stringify_content(self, content: object) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            text_parts: list[str] = []
            for part in content:
                if isinstance(part, str):
                    text_parts.append(part)
                    continue
                if isinstance(part, dict) and part.get("type") == "text":
                    text = part.get("text")
                    if isinstance(text, str):
                        text_parts.append(text)
            if text_parts:
                return "\n".join(text_parts).strip()
        return "죄송해요. 답변을 텍스트로 변환하지 못했어요."

    def _extract_tool_data(self, messages: list) -> dict[str, list[dict]]:
        tool_data: dict[str, list[dict]] = {}
        for message in messages:
            if getattr(message, "type", "") != "tool":
                continue

            tool_name = str(getattr(message, "name", "unknown_tool"))
            content = getattr(message, "content", "")
            normalized_output: object = self._normalize_tool_output(content)

            payload = {
                "call_id": getattr(message, "tool_call_id", None),
                "output": normalized_output,
            }
            tool_data.setdefault(tool_name, []).append(payload)
        return tool_data

    def _normalize_tool_output(self, content: object) -> object:
        if isinstance(content, list):
            return content
        if isinstance(content, str):
            stripped = content.strip()
            if stripped.startswith("{") or stripped.startswith("["):
                try:
                    return json.loads(stripped)
                except json.JSONDecodeError:
                    return content
        return content

    def _extract_search_sources(self, tool_data: dict[str, list[dict]]) -> list[str]:
        sources: list[str] = []
        for tool_name, calls in tool_data.items():
            if "tavily" not in tool_name.lower():
                continue
            for call in calls:
                output = call.get("output")
                if not isinstance(output, list):
                    continue
                for item in output:
                    if not isinstance(item, dict):
                        continue
                    url = item.get("url")
                    if isinstance(url, str) and url not in sources:
                        sources.append(url)
        return sources


cat_agent = CatAgentService()
