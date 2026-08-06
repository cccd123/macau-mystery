from __future__ import annotations
"""UGC Drama Generator"""
from app.ai.llm_client import chat_with_llm
from app.ugc.templates import get_template

async def generate_drama(user_input: str, style: str, options: dict | None = None) -> dict:
    template = get_template(style)
    era = options.get("era", "清代") if options else "清代"
    acts = options.get("acts", 3) if options else 3
    prompt = template["prompt"].format(user_input=user_input, era=era, acts=acts)
    if options and options.get("custom_prompt"):
        prompt += f"\n\n额外要求: {options['custom_prompt']}"
    response = await chat_with_llm(
        system_prompt="你是一个专业的互动剧剧作家，擅长创作融入澳门历史元素的短剧。请返回JSON格式。",
        user_message=prompt, temperature=template.get("temperature", 0.8),
    )
    import json
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"title": "AI生成短剧", "raw_response": response, "chapters": []}
