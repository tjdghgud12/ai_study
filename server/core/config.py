from typing import TypedDict

from pydantic_settings import BaseSettings, SettingsConfigDict


class AiModelConfig(TypedDict):
    model: str
    temperature: float


class MCPSettings(BaseSettings):
    tavily_api_key: str
    brave_search_api_key: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    dev_frontend_url: str
    brave_search_api_key: str

    project_name: str = "Cat AI Agent"

    # gemma-4-31b-it
    # gemini-3.1-flash-lite
    main_llm_config: AiModelConfig = {
        "model": "gemini-3.1-flash-lite",
        "temperature": 0.2,
    }

    router_llm_config: AiModelConfig = {
        "model": "gemma-4-26b-a4b-it",
        "temperature": 0.1,
    }

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


mcp_settings = MCPSettings()
settings = Settings()
