import os
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.models import ScriptMeta, ScriptCreateRequest, ScriptUpdateRequest

router = APIRouter()

scripts_db: dict[str, dict] = {
    "1": {"id": "1", "title": "跨越中葡的悬案", "description": "澳门历史城区沉浸式剧本杀",
          "status": "published", "chapters_count": 6, "players_count": 128, "created_at": "2026-07-28"},
    "2": {"id": "2", "title": "澳门往事：一封未寄出的信", "description": "UGC生成短剧",
          "status": "draft", "chapters_count": 3, "players_count": 0, "created_at": "2026-08-01"},
}


@router.get("/scripts", response_model=list[ScriptMeta])
async def list_scripts():
    return [ScriptMeta(**s) for s in scripts_db.values()]


@router.post("/scripts", response_model=ScriptMeta)
async def create_script(req: ScriptCreateRequest):
    new_id = str(len(scripts_db) + 1)
    script = {"id": new_id, "title": req.title, "description": req.description,
              "status": "draft", "chapters_count": 0, "players_count": 0, "created_at": "2026-08-01"}
    scripts_db[new_id] = script
    return ScriptMeta(**script)


@router.put("/scripts/{script_id}", response_model=ScriptMeta)
async def update_script(script_id: str, req: ScriptUpdateRequest):
    if script_id not in scripts_db:
        raise HTTPException(status_code=404, detail="Script not found")
    s = scripts_db[script_id]
    if req.title: s["title"] = req.title
    if req.description: s["description"] = req.description
    if req.status: s["status"] = req.status
    return ScriptMeta(**s)


@router.delete("/scripts/{script_id}")
async def delete_script(script_id: str):
    if script_id not in scripts_db:
        raise HTTPException(status_code=404, detail="Script not found")
    del scripts_db[script_id]
    return {"message": "Deleted"}


@router.post("/scripts/{script_id}/publish")
async def publish_script(script_id: str):
    if script_id not in scripts_db:
        raise HTTPException(status_code=404, detail="Script not found")
    s = scripts_db[script_id]
    s["status"] = "draft" if s["status"] == "published" else "published"
    return {"status": s["status"]}
