"""Enhanced admin API with stats, submissions review, AI generation, route config"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

# --- Script store ---
scripts_db: dict[str, dict] = {
    "1": {
        "id": "1",
        "title": "Macau Mystery: The Cross-Border Case",
        "description": "Immersive murder mystery along Macau heritage trail",
        "status": "published",
        "chapters_count": 6,
        "players_count": 128,
        "views_count": 1540,
        "created_at": "2026-07-28",
        "route": ["Barra Temple", "Lilau Square", "Mandarin House", "Dom Pedro V", "Senado Square", "Ruins of St Paul"],
    },
    "2": {
        "id": "2",
        "title": "The Unsent Letter",
        "description": "A love story across Portuguese and Chinese families",
        "status": "draft",
        "chapters_count": 3,
        "players_count": 0,
        "views_count": 0,
        "created_at": "2026-08-01",
        "route": [],
    },
}

# --- Models ---
class ScriptCreateRequest(BaseModel):
    title: str
    description: str = ""

class ScriptUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class AIGenerateRequest(BaseModel):
    input: str
    mode: str = "quick"  # "quick" or "polish"

class ScriptMeta(BaseModel):
    id: str
    title: str
    description: str = ""
    status: str
    chapters_count: int
    players_count: int
    views_count: int = 0
    created_at: str

# --- Auth helper ---
def _require_admin(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    from app.api.auth import tokens_db, users_db
    token = authorization.replace("Bearer ", "")
    username = tokens_db.get(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = users_db.get(username)
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# --- Script CRUD ---
@router.get("/scripts")
async def list_scripts():
    return list(scripts_db.values())

@router.post("/scripts")
async def create_script(req: ScriptCreateRequest, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    new_id = str(len(scripts_db) + 100)
    script = {
        "id": new_id,
        "title": req.title,
        "description": req.description,
        "status": "draft",
        "chapters_count": 0,
        "players_count": 0,
        "views_count": 0,
        "created_at": datetime.now().strftime("%Y-%m-%d"),
        "route": [],
    }
    scripts_db[new_id] = script
    return script

@router.put("/scripts/{script_id}")
async def update_script(script_id: str, req: ScriptUpdateRequest, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    if script_id not in scripts_db:
        raise HTTPException(status_code=404, detail="Script not found")
    s = scripts_db[script_id]
    if req.title:
        s["title"] = req.title
    if req.description:
        s["description"] = req.description
    if req.status:
        s["status"] = req.status
    return s

@router.delete("/scripts/{script_id}")
async def delete_script(script_id: str, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    if script_id not in scripts_db:
        raise HTTPException(status_code=404, detail="Script not found")
    del scripts_db[script_id]
    return {"message": "Deleted"}

@router.post("/scripts/{script_id}/publish")
async def publish_script(script_id: str, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    if script_id not in scripts_db:
        raise HTTPException(status_code=404, detail="Script not found")
    s = scripts_db[script_id]
    s["status"] = "draft" if s["status"] == "published" else "published"
    return {"status": s["status"]}

# --- AI Generation ---
@router.post("/scripts/ai-generate")
async def ai_generate_script(req: AIGenerateRequest, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    new_id = str(uuid.uuid4())[:8]
    if req.mode == "quick":
        chapters = [
            {
                "id": f"ch{i+1}",
                "title": f"Chapter {i+1}",
                "scenes": [{
                    "id": f"ch{i+1}_s1",
                    "narration": f'AI-generated scene based on "{req.input}"...',
                    "dialogue": {"npc": "NPC", "text": "AI will generate real content when DeepSeek is connected."},
                    "choices": [{"id": "c1", "text": "Option A"}, {"id": "c2", "text": "Option B"}],
                }],
            }
            for i in range(3)
        ]
    else:
        chapters = [{
            "id": "ch1",
            "title": "Chapter 1: Introduction",
            "scenes": [{
                "id": "ch1_s1",
                "narration": f'Polished version of your idea: "{req.input}"',
                "dialogue": {"npc": "Guide", "text": "Welcome to the story. Your concept has been refined by AI."},
                "choices": [{"id": "c1", "text": "Begin investigation"}, {"id": "c2", "text": "Ask for background"}],
            }],
        }]

    script = {
        "id": new_id,
        "title": f"AI Generated: {req.input[:30]}",
        "description": f"Mode: {req.mode} | Input: {req.input}",
        "status": "draft",
        "chapters_count": len(chapters),
        "players_count": 0,
        "views_count": 0,
        "created_at": datetime.now().strftime("%Y-%m-%d"),
        "route": [],
        "chapters": chapters,
    }
    scripts_db[new_id] = script
    return script

# --- Stats ---
@router.get("/stats")
async def get_stats():
    total_players = sum(s.get("players_count", 0) for s in scripts_db.values())
    total_views = sum(s.get("views_count", 0) for s in scripts_db.values())
    published = sum(1 for s in scripts_db.values() if s["status"] == "published")
    return {
        "total_scripts": len(scripts_db),
        "total_players": total_players,
        "total_views": total_views,
        "published": published,
        "drafts": len(scripts_db) - published,
    }

# --- Submissions Review ---
@router.get("/submissions")
async def list_submissions(authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    from app.api.ugc_user import submissions_db
    return list(submissions_db.values())

@router.post("/submissions/{sub_id}/approve")
async def approve_submission(sub_id: str, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    from app.api.ugc_user import submissions_db
    sub = submissions_db.get(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub["status"] = "approved"
    return {"status": "approved"}

@router.post("/submissions/{sub_id}/reject")
async def reject_submission(sub_id: str, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    from app.api.ugc_user import submissions_db
    sub = submissions_db.get(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub["status"] = "rejected"
    return {"status": "rejected"}

# --- Route Config ---
@router.get("/route")
async def get_route():
    published_scripts = [s for s in scripts_db.values() if s["status"] == "published" and s.get("route")]
    if published_scripts:
        return published_scripts[0].get("route", [])
    return ["Barra Temple", "Lilau Square", "Mandarin House", "Dom Pedro V Theatre", "Senado Square", "Ruins of St Paul"]
