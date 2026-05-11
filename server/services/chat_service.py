import uuid

from fastapi import HTTPException
from langchain.agents import create_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import settings
from schemas.chat_schema import ChatResponse


class CatAgentService:
    def __init__(self):
        model = ChatGoogleGenerativeAI(
            **settings.main_llm_config, google_api_key=settings.google_api_key
        )
        self.llm = model
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
            response_format=ChatResponse,
        )

        print(f"Create {settings.project_name} Agent!!")

    async def ask_question(self, user_input: str, session_id: str | None = None) -> ChatResponse:
        last_error: Exception | None = None

        if session_id is None:
            session_id = self.create_session_id()

        for _ in range(2):  # 최초 1회 + 재시도 1회
            try:
                result = await self.agent.ainvoke(
                    {"messages": [{"role": "user", "content": user_input}]}
                )
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


cat_agent = CatAgentService()
