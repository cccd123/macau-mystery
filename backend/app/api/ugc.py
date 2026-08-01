import uuid
from fastapi import APIRouter
from app.models import GenerateRequest, GenerateResponse

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate_drama(req: GenerateRequest):
    """一句话生成短剧 - 当前Mock，后续接入DeepSeek"""
    script_id = str(uuid.uuid4())[:8]
    mock_chapters = [
        {
            "id": f"ch{i+1}", "title": f"第{i+1}幕",
            "scenes": [{
                "id": f"ch{i+1}_s1",
                "narration": f"基于\"{req.input}\"生成的剧情...",
                "dialogue": {"npc": "NPC", "text": "这是AI生成的对话。待接入DeepSeek后将生成真实内容。"},
                "choices": [{"id": "c1", "text": "选择A"}, {"id": "c2", "text": "选择B"}],
            }],
        }
        for i in range(3)
    ]
    return GenerateResponse(
        script_id=script_id,
        title=f"AI生成短剧: {req.input[:20]}",
        chapters=mock_chapters, style=req.style,
        era=req.options.get("era", "qing") if req.options else "qing",
    )


@router.post("/regenerate/{script_id}")
async def regenerate_drama(script_id: str):
    return {"script_id": script_id, "status": "regenerated"}
