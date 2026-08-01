"""LLM Client - DeepSeek via SiliconFlow"""
import os
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key=os.getenv("SILICONFLOW_API_KEY", "sk-placeholder"),
    base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1"),
)
MODEL = os.getenv("LLM_MODEL", "deepseek-ai/DeepSeek-V3")


async def chat_with_llm(system_prompt: str, user_message: str, temperature: float = 0.7) -> str:
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=temperature, max_tokens=500,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"LLM Error: {e}")
        return f"[模型调用失败: {e}]"


async def chat_with_npc(npc_id: str, user_message: str, context: dict | None = None) -> str:
    from app.ai.prompt_templates import get_npc_prompt
    system_prompt = get_npc_prompt(npc_id, context)
    return await chat_with_llm(system_prompt, user_message)
