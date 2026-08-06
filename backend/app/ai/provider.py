"""SiliconFlow-compatible chat and embedding provider helpers."""
from __future__ import annotations

from functools import lru_cache

from openai import AsyncOpenAI

from app.config import get_settings
from app.generation_errors import AIProviderError, AIServiceNotConfigured


def provider_is_configured(api_key: str) -> bool:
    normalized = api_key.strip().lower()
    return bool(normalized) and "placeholder" not in normalized and "your-key" not in normalized


@lru_cache(maxsize=4)
def _client(api_key: str, base_url: str, timeout_seconds: int) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=timeout_seconds)


def get_provider_client() -> AsyncOpenAI:
    settings = get_settings()
    if not provider_is_configured(settings.siliconflow_api_key):
        raise AIServiceNotConfigured()
    return _client(
        settings.siliconflow_api_key,
        settings.siliconflow_base_url,
        settings.ai_timeout_seconds,
    )


async def create_embeddings(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    settings = get_settings()
    try:
        response = await get_provider_client().embeddings.create(
            model=settings.embedding_model,
            input=texts,
            encoding_format="float",
        )
    except AIServiceNotConfigured:
        raise
    except Exception as exc:
        raise AIProviderError("知识向量服务暂时不可用") from exc

    ordered = sorted(response.data, key=lambda item: item.index)
    if len(ordered) != len(texts):
        raise AIProviderError("知识向量服务返回数量不完整")
    return [list(item.embedding) for item in ordered]


async def complete_text(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float,
) -> str:
    settings = get_settings()
    try:
        response = await get_provider_client().chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=settings.llm_max_tokens,
        )
    except AIServiceNotConfigured:
        raise
    except Exception as exc:
        raise AIProviderError() from exc

    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise AIProviderError("模型返回了空内容")
    return content
