from typing import TypedDict

from pydantic_settings import BaseSettings, SettingsConfigDict


class AiModelConfig(TypedDict):
    model: str
    temperature: float


class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    dev_frontend_url: str

    project_name: str = "Cat Agent AI"

    main_llm_config: AiModelConfig = {
        "model": "gemma-4-31b-it",
        "temperature": 0.2,
    }

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
