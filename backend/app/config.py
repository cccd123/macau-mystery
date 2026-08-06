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


def _positive_int(value: str | None, *, default: int, name: str) -> int:
    if value is None:
        return default
    try:
        parsed = int(value)
    except ValueError as exc:
        raise ValueError(f"{name} 必须是正整数") from exc
    if parsed < 1:
        raise ValueError(f"{name} 必须是正整数")
    return parsed


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: tuple[str, ...]
    app_env: str
    bootstrap_demo_story: bool
    bootstrap_demo_users: bool
    auth_token_ttl_hours: int
    demo_admin_username: str
    demo_admin_password: str
    demo_guest_username: str
    demo_guest_password: str
    object_storage_enabled: bool
    s3_endpoint_url: str
    s3_presign_endpoint_url: str
    s3_access_key_id: str
    s3_secret_access_key: str
    s3_bucket: str
    s3_region: str
    s3_addressing_style: str
    media_public_base_url: str
    media_upload_ttl_seconds: int
    media_max_video_bytes: int
    media_max_poster_bytes: int
    media_cors_origins: tuple[str, ...]
    siliconflow_api_key: str
    siliconflow_base_url: str
    llm_model: str
    embedding_model: str
    ai_timeout_seconds: int
    llm_max_tokens: int
    rag_enabled: bool
    chroma_persist_path: str
    rag_top_k: int
    generated_script_cache_size: int

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
        bootstrap_demo_users=_as_bool(
            os.getenv("BOOTSTRAP_DEMO_USERS"), default=app_env.lower() != "production"
        ),
        auth_token_ttl_hours=_positive_int(
            os.getenv("AUTH_TOKEN_TTL_HOURS"), default=168, name="AUTH_TOKEN_TTL_HOURS"
        ),
        demo_admin_username=os.getenv("DEMO_ADMIN_USERNAME", "admin"),
        demo_admin_password=os.getenv("DEMO_ADMIN_PASSWORD", "admin123"),
        demo_guest_username=os.getenv("DEMO_GUEST_USERNAME", "guest"),
        demo_guest_password=os.getenv("DEMO_GUEST_PASSWORD", "guest123"),
        object_storage_enabled=_as_bool(os.getenv("OBJECT_STORAGE_ENABLED"), default=False),
        s3_endpoint_url=os.getenv("S3_ENDPOINT_URL", "").rstrip("/"),
        s3_presign_endpoint_url=os.getenv(
            "S3_PRESIGN_ENDPOINT_URL", os.getenv("S3_ENDPOINT_URL", "")
        ).rstrip("/"),
        s3_access_key_id=os.getenv("S3_ACCESS_KEY_ID", ""),
        s3_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY", ""),
        s3_bucket=os.getenv("S3_BUCKET", "macau-media"),
        s3_region=os.getenv("S3_REGION", "us-east-1"),
        s3_addressing_style=os.getenv("S3_ADDRESSING_STYLE", "path"),
        media_public_base_url=os.getenv("MEDIA_PUBLIC_BASE_URL", "").rstrip("/"),
        media_upload_ttl_seconds=_positive_int(
            os.getenv("MEDIA_UPLOAD_TTL_SECONDS"), default=900, name="MEDIA_UPLOAD_TTL_SECONDS"
        ),
        media_max_video_bytes=_positive_int(
            os.getenv("MEDIA_MAX_VIDEO_BYTES"), default=1073741824, name="MEDIA_MAX_VIDEO_BYTES"
        ),
        media_max_poster_bytes=_positive_int(
            os.getenv("MEDIA_MAX_POSTER_BYTES"), default=10485760, name="MEDIA_MAX_POSTER_BYTES"
        ),
        media_cors_origins=_cors_origins(os.getenv("MEDIA_CORS_ORIGINS")),
        siliconflow_api_key=os.getenv("SILICONFLOW_API_KEY", ""),
        siliconflow_base_url=os.getenv(
            "SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1"
        ).rstrip("/"),
        llm_model=os.getenv("LLM_MODEL", "deepseek-ai/DeepSeek-V3"),
        embedding_model=os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-zh-v1.5"),
        ai_timeout_seconds=_positive_int(
            os.getenv("AI_TIMEOUT_SECONDS"), default=90, name="AI_TIMEOUT_SECONDS"
        ),
        llm_max_tokens=_positive_int(
            os.getenv("LLM_MAX_TOKENS"), default=6000, name="LLM_MAX_TOKENS"
        ),
        rag_enabled=_as_bool(os.getenv("RAG_ENABLED"), default=True),
        chroma_persist_path=os.getenv("CHROMA_PERSIST_PATH", "./chroma_db"),
        rag_top_k=_positive_int(os.getenv("RAG_TOP_K"), default=4, name="RAG_TOP_K"),
        generated_script_cache_size=_positive_int(
            os.getenv("GENERATED_SCRIPT_CACHE_SIZE"),
            default=256,
            name="GENERATED_SCRIPT_CACHE_SIZE",
        ),
    )
