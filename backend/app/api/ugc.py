import uuid
from fastapi import APIRouter
from app.models import GenerateRequest, GenerateResponse

router = APIRouter()

_LOCATION_POOL = [
    ("妈阁庙", "A-Ma Temple", 22.1867, 113.5318),
    ("亚婆井前地", "Lilau Square", 22.1876, 113.5331),
    ("郑家大屋", "Mandarin's House", 22.1879, 113.5347),
    ("岗顶剧院", "Dom Pedro V Theatre", 22.1892, 113.5389),
    ("议事亭前地", "Senado Square", 22.1918, 113.5396),
    ("大三巴牌坊", "Ruins of St. Paul's", 22.1946, 113.5414),
]

_STYLE_LABELS = {
    "suspense": "悬疑", "romance": "爱情",
    "comedy": "喜剧", "tragedy": "悲剧",
}

_ERA_LABELS = {
    "qing": "清代", "ming": "明代", "modern": "现代", "colonial": "葡治时期",
}


@router.post("/generate", response_model=GenerateResponse)
async def generate_drama(req: GenerateRequest):
    """一句话生成短剧 — 当前为演示模式 Mock，后续接入 DeepSeek。"""
    script_id = str(uuid.uuid4())[:8]
    style_label = _STYLE_LABELS.get(req.style, "悬疑")
    era_label = _ERA_LABELS.get(
        req.options.get("era", "qing") if req.options else "qing", "清代"
    )
    acts = int(req.options.get("acts", 3)) if req.options else 3
    user_input = req.input[:30]

    chapters = []
    for i in range(acts):
        loc_cn, loc_en, _lat, _lng = _LOCATION_POOL[i % len(_LOCATION_POOL)]
        chapters.append({
            "id": f"ch{i + 1}",
            "title": f"第{i + 1}幕：{loc_cn}",
            "location": loc_cn,
            "gps": {"lat": _lat, "lng": _lng},
            "scenes": [
                {
                    "id": f"ch{i + 1}_s1",
                    "narration": (
                        f"你来到{loc_cn}，周围弥漫着历史的气息。"
                        f"作为\"{user_input}\"故事的一部分，这里隐藏着关键线索。"
                        f"墙壁上斑驳的痕迹诉说着{era_label}时期的往事。"
                    ),
                    "dialogue": {
                        "npc": f"{loc_cn}的向导",
                        "text": (
                            f"欢迎来到{loc_cn}。这里是澳门历史城区的重要组成部分。"
                            f"在{era_label}时期，这里曾发生过许多不为人知的故事……"
                        ),
                    },
                    "choices": [
                        {"id": f"ch{i + 1}_c1", "text": "深入调查线索"},
                        {"id": f"ch{i + 1}_c2", "text": "询问更多细节"},
                    ],
                }
            ],
        })

    return GenerateResponse(
        script_id=script_id,
        title=f"《{user_input}》— {style_label}短剧",
        chapters=chapters,
        style=req.style,
        era=era_label,
        demo_mode=True,
    )


@router.post("/regenerate/{script_id}")
async def regenerate_drama(script_id: str):
    return {"script_id": script_id, "status": "regenerated"}
