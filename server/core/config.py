from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    dev_frontend_url: str

    project_name: str = "Cat Agent AI"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
