from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded exclusively from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Dream Car Bazaar API"
    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "postgresql+psycopg://dreamcar:local@localhost:5432/dream_car_bazaar"
    redis_url: str = "redis://localhost:6379/0"
    app_secret_key: str
    frontend_origin: str = "http://localhost:3000"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
