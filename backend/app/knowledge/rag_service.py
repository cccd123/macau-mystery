"""Lightweight RAG over local Macau heritage documents."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

from app.ai.llm_client import chat_with_llm
from app.location_service import find_location

DOCS_DIR = Path(__file__).parent / "macau_docs"

# Map location names / ids to the most relevant doc file.
_LOCATION_DOC_MAP = {
    "妈阁庙": "a_ma_temple.txt",
    "妈祖阁": "a_ma_temple.txt",
    "a_ma_temple": "a_ma_temple.txt",
    "亚婆井前地": "lilau_square.txt",
    "lilau_square": "lilau_square.txt",
    "郑家大屋": "zheng_house.txt",
    "mandarins_house": "zheng_house.txt",
    "zheng_house": "zheng_house.txt",
    "岗顶剧院": "dom_pedro_theatre.txt",
    "伯多禄五世剧院": "dom_pedro_theatre.txt",
    "dom_pedro_v_theatre": "dom_pedro_theatre.txt",
    "议事亭前地": "senado_square.txt",
    "senado_square": "senado_square.txt",
    "大三巴牌坊": "ruins_of_st_paul.txt",
    "ruins_of_st_paul": "ruins_of_st_paul.txt",
}


def _load_doc(filename: str) -> str:
    path = DOCS_DIR / filename
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def get_location_facts(location_name: str) -> str:
    """Return a short historical fact string for a given location name."""
    filename = _LOCATION_DOC_MAP.get(location_name)
    if not filename:
        for loc_key, fn in _LOCATION_DOC_MAP.items():
            if loc_key.lower() in location_name.lower() or location_name.lower() in loc_key.lower():
                filename = fn
                break
    if not filename:
        return ""
    text = _load_doc(filename)
    if not text:
        return ""
    sentences = _split_sentences(text)
    # Pick the two most informative sentences (roughly by length).
    informative = sorted(sentences, key=len, reverse=True)[:2]
    return " ".join(informative)


def _split_sentences(text: str) -> list[str]:
    # Split on Chinese full stop, question mark, exclamation mark, or newline.
    parts = re.split(r"[。！？\n]+", text)
    return [p.strip() for p in parts if len(p.strip()) > 8]


def _score(query: str, sentence: str) -> int:
    q_tokens = set(query.lower().split())
    # Very simple Chinese char token overlap for single chars
    q_chars = set(query.lower())
    s_lower = sentence.lower()
    token_hits = sum(1 for t in q_tokens if len(t) > 1 and t in s_lower)
    char_hits = sum(1 for c in q_chars if "\u4e00" <= c <= "\u9fff" and c in s_lower)
    return token_hits * 3 + char_hits


def _retrieve_context(location_id: str, question: str, top_k: int = 4) -> tuple[str, str]:
    """Return (context, doc_name) for the given location and question."""
    filename = _LOCATION_DOC_MAP.get(location_id.lower())
    if not filename:
        # Fallback: search all docs for the location name in content.
        for loc_key, fn in _LOCATION_DOC_MAP.items():
            if loc_key.lower() in location_id.lower() or location_id.lower() in loc_key.lower():
                filename = fn
                break
    if not filename:
        return ("", "")

    parts: list[str] = []
    doc_name = filename.replace(".txt", "")

    # Include the curated location description as a verified baseline.
    location = find_location(location_id)
    if location:
        parts.append(f"{location.name}简介：{location.description}")

    text = _load_doc(filename)
    if text:
        sentences = _split_sentences(text)
        if sentences:
            scored = sorted(
                ((s, _score(question, s)) for s in sentences),
                key=lambda x: x[1],
                reverse=True,
            )
            selected = [s for s, _ in scored[:top_k]]
            parts.extend(selected)
        else:
            parts.append(text[:400])

    if not parts:
        return ("", doc_name)

    return ("\n".join(f"- {s}" for s in parts), doc_name)


_SYSTEM_PROMPT = (
    "你是澳门历史城区的智能导览助手。请严格依据下面提供的参考资料，用1到3句话简洁、准确地回答游客提问。"
    "回答要聚焦问题，不要过度发挥；若参考资料中没有相关信息，请直接说明“目前资料中未提及”。"
    "不要编造，不要使用参考资料之外的内容。"
)


async def ask_about_location(location_id: str, question: str) -> dict[str, str]:
    location_id = location_id.strip()
    question = question.strip()
    context, doc_name = _retrieve_context(location_id, question)
    if not context:
        return {
            "answer": "抱歉，我暂时没有找到关于这个地点的详细资料。",
            "source": "",
        }

    user_message = f"参考资料：\n{context}\n\n游客提问：{question}"
    llm_answer = await chat_with_llm(_SYSTEM_PROMPT, user_message, temperature=0.3)

    # If the LLM call failed (placeholder key / network error), fall back to the most relevant sentence.
    if not llm_answer or llm_answer.startswith("[") or "调用失败" in llm_answer:
        best = context.split("\n")[0].lstrip("- ").strip()
        return {
            "answer": best,
            "source": doc_name,
        }

    return {
        "answer": llm_answer.strip(),
        "source": doc_name,
    }
