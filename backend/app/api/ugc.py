"""One-sentence drama generation with optional location selection and RAG facts."""
from __future__ import annotations

import random
import uuid
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.knowledge.rag_service import get_location_facts
from app.models import GenerateRequest, GenerateResponse

router = APIRouter()

_LOCATION_POOL = [
    ("妈阁庙", 22.1867, 113.5318),
    ("亚婆井前地", 22.1876, 113.5331),
    ("郑家大屋", 22.1879, 113.5347),
    ("岗顶剧院", 22.1892, 113.5389),
    ("议事亭前地", 22.1918, 113.5396),
    ("大三巴牌坊", 22.1946, 113.5414),
]

_STYLE_LABELS = {
    "suspense": "悬疑",
    "romance": "爱情",
    "comedy": "喜剧",
    "tragedy": "悲剧",
}

_ERA_LABELS = {
    "qing": "清代",
    "ming": "明代",
    "modern": "现代",
    "colonial": "葡治时期",
}


class GenerateResponseExtra(GenerateResponse):
    description: str = ""


def _pick_locations(user_locations: Optional[list[str]]) -> list[tuple[str, float, float]]:
    """Pick locations from user input, with fuzzy fallback; random if none."""
    if user_locations:
        selected: list[tuple[str, float, float]] = []
        for ul in user_locations:
            ul_norm = ul.strip()
            for name, lat, lng in _LOCATION_POOL:
                if ul_norm in name or name in ul_norm:
                    if (name, lat, lng) not in selected:
                        selected.append((name, lat, lng))
                    break
        if selected:
            return selected
    # Random 3-4 locations if nothing selected.
    count = random.choice([3, 4])
    return random.sample(_LOCATION_POOL, count)


def _build_story(input_text: str, style: str, era: str, locations: list[tuple[str, float, float]]) -> dict:
    style_label = _STYLE_LABELS.get(style, "悬疑")
    era_label = _ERA_LABELS.get(era, "清代")

    # A unifying MacGuffin that strings the locations into one coherent plot.
    macguffins = {
        "suspense": ("一封署名为“M”的密信", "密信的墨迹", "破解密信"),
        "romance": ("一枚刻有莲花纹的银簪", "银簪的微光", "找回定情之物"),
        "comedy": ("一张写错地址的喜帖", "喜帖上的错别字", "把喜帖送到正确的人手中"),
        "tragedy": ("半幅染血的航海图", "航海图上的航线", "揭开失踪的真相"),
    }
    macguffin, trace, goal = macguffins.get(style, macguffins["suspense"])

    chapters = []
    collected_clues = 0
    for i, (name, lat, lng) in enumerate(locations):
        facts = get_location_facts(name)
        is_last = i == len(locations) - 1

        # Build a narration that connects this location to the previous one and the MacGuffin.
        arrival = "故事从这里开始" if i == 0 else f"离开{locations[i - 1][0]}后，你循着{trace}来到{name}"
        narration = (
            f"{arrival}。{facts} "
            f"你隐约觉得，这与“{input_text}”以及那件{macguffin}有关。{era_label}的澳门，"
            f"每一处砖瓦似乎都藏着通往真相的提示。"
        )
        dialogue_text = (
            f"一位路过的老人低声说：“{name}的老故事里有句话：{facts[:60]}……也许对你有用。”"
            if facts else
            f"{name}的向导提醒你：这里每一块石头都看过{era_label}的风云。"
        )

        # Choices: one advances the plot and grants a clue, the other simply advances.
        investigate_choice = {
            "id": f"ch{i + 1}_c1",
            "text": "仔细搜查与那件事相关的痕迹",
            "next_scene": f"ch{i + 2}_start" if not is_last else "ending",
            "grant_clues": [f"{name}的关键线索"],
            "clue_text": f"你在{name}发现了与{macguffin}有关的痕迹。",
        }
        observe_choice = {
            "id": f"ch{i + 1}_c2",
            "text": "先向当地人打听情况",
            "next_scene": f"ch{i + 2}_start" if not is_last else "ending",
        }
        choices = [investigate_choice, observe_choice]

        chapters.append({
            "id": f"ch{i + 1}",
            "title": f"第{i + 1}幕：{name}",
            "location": name,
            "gps": {"lat": lat, "lng": lng},
            "scenes": [
                {
                    "id": f"ch{i + 1}_start",
                    "narration": narration,
                    "dialogue": {"npc": f"{name}的向导", "text": dialogue_text},
                    "choices": choices,
                }
            ],
        })
        collected_clues += 1  # tracks potential clues

    # Ending branches on whether the player collected enough clues.
    good_ending = (
        f"你集齐了关键线索，{goal}，{style_label}故事的真相终于浮出水面。"
    )
    normal_ending = (
        f"你走到了终点，但似乎遗漏了一些细节；{macguffin}的秘密仍未完全揭开。"
    )
    chapters[-1]["scenes"].append({
        "id": "ending",
        "narration": good_ending if collected_clues >= len(locations) else normal_ending,
        "dialogue": {"npc": "旁白", "text": "一段澳门历史与个人命运交汇的旅程告一段落。"},
        "choices": [],
    })

    route_names = " → ".join(name for name, _, _ in locations)
    return {
        "title": f"《{input_text[:30]}》— {style_label}短剧",
        "description": f"以“{input_text[:30]}”为主线，串联{len(locations)}处澳门历史景点：{route_names}。",
        "chapters": chapters,
    }


@router.post("/generate", response_model=GenerateResponseExtra)
async def generate_drama(req: GenerateRequest) -> GenerateResponseExtra:
    """一句话生成短剧 — 演示模式：可选地点，融入本地 RAG 知识。"""
    script_id = str(uuid.uuid4())[:8]
    style_label = _STYLE_LABELS.get(req.style, "悬疑")
    options = req.options or {}
    era = options.get("era", "qing")
    era_label = _ERA_LABELS.get(era, "清代")
    user_input = req.input[:40] if req.input else "澳门奇遇"
    user_locations = options.get("locations")
    if isinstance(user_locations, str):
        user_locations = [user_locations]

    locations = _pick_locations(user_locations)
    story = _build_story(user_input, req.style, era, locations)

    return GenerateResponseExtra(
        script_id=script_id,
        title=story["title"],
        description=story["description"],
        chapters=story["chapters"],
        style=req.style,
        era=era_label,
        demo_mode=True,
    )


@router.post("/regenerate/{script_id}")
async def regenerate_drama(script_id: str):
    return {"script_id": script_id, "status": "regenerated"}
