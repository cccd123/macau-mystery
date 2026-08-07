"""LLM Client - SiliconFlow / DashScope(Qwen) fallback."""
from __future__ import annotations
import os
from openai import AsyncOpenAI, APIError


def _client_for(base_url: str, api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, base_url=base_url)


async def _try_chat(
    client: AsyncOpenAI,
    model: str,
    system_prompt: str,
    user_message: str,
    temperature: float,
    max_tokens: int = 500,
) -> str | None:
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content
        return content.strip() if content else None
    except APIError as e:
        print(f"LLM API error ({model}): {e}")
        return None
    except Exception as e:
        print(f"LLM unexpected error ({model}): {e}")
        return None


async def chat_with_llm(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.7,
    max_tokens: int = 500,
) -> str:
    """Try SiliconFlow first, then fall back to DashScope (Qwen)."""

    # 1. SiliconFlow (DeepSeek / Qwen via SiliconFlow)
    sf_key = os.getenv("SILICONFLOW_API_KEY")
    sf_base = os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
    sf_model = os.getenv("LLM_MODEL", "deepseek-ai/DeepSeek-V3")
    if sf_key and not sf_key.startswith("sk-placeholder"):
        client = _client_for(sf_base, sf_key)
        answer = await _try_chat(
            client, sf_model, system_prompt, user_message, temperature, max_tokens
        )
        if answer:
            return answer

    # 2. DashScope (Tongyi Qwen) - OpenAI compatible endpoint
    ds_key = os.getenv("DASHSCOPE_API_KEY")
    ds_base = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    ds_model = os.getenv("DASHSCOPE_MODEL", "qwen-turbo")
    if ds_key and not ds_key.startswith("sk-placeholder"):
        client = _client_for(ds_base, ds_key)
        answer = await _try_chat(
            client, ds_model, system_prompt, user_message, temperature, max_tokens
        )
        if answer:
            return answer

    return "[模型调用失败: 未配置有效的 SILICONFLOW_API_KEY 或 DASHSCOPE_API_KEY]"


async def chat_with_npc(npc_id: str, user_message: str, context: dict | None = None) -> str:
    from app.ai.prompt_templates import get_npc_prompt
    system_prompt = get_npc_prompt(npc_id, context)
    return await chat_with_llm(system_prompt, user_message)
