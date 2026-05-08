from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    llm_base_url: str = Field(..., description="Base URL for the OpenAI-compatible LLM API")
    chat_model: str = Field(..., description="Model name to use for chat completions")
    embed_model: str = Field(..., description="Model name to use for embeddings")
    database_url: str = Field(..., description="Async SQLAlchemy database URL")
    vector_store_path: str = Field(..., description="Directory for persistent ChromaDB storage")
    cors_origins: str = Field(..., description="Comma-separated list of allowed CORS origins")

    # Orchestrator knobs
    max_retries: int = Field(default=2, description="Max validator retry loops")
    min_campaign_posts: int = Field(default=5, description="Minimum posts required in a campaign")

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
