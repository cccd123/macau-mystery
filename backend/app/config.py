"""Runtime configuration for the backend."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


DEFAULT_SQLITE_URL = "sqlite+aiosqlite:///./macau_mystery.db"
DEFAULT_CORS_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")


def _as_bool(value: str | None, *, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _cors_origins(value: str | None) -> tuple[str, ...]:
    if not value:
        return DEFAULT_CORS_ORIGINS
    origins = tuple(origin.strip() for origin in value.split(",") if origin.strip())
    return origins or DEFAULT_CORS_ORIGINS


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: tuple[str, ...]
    app_env: str
    bootstrap_demo_story: bool

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    app_env = os.getenv("APP_ENV", "development")
    return Settings(
        database_url=os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL),
        cors_origins=_cors_origins(os.getenv("CORS_ORIGINS")),
        app_env=app_env,
        bootstrap_demo_story=_as_bool(
            os.getenv("BOOTSTRAP_DEMO_STORY"), default=app_env.lower() != "production"
        ),
    )
