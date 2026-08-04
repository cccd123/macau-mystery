"""UGC user scripts API - publish, list, submit to official"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

# User scripts store
user_scripts_db: dict[str, dict] = {}

# Submissions for admin review
submissions_db: dict[str, dict] = {}


class PublishRequest(BaseModel):
    is_public: bool = False


class SubmitRequest(BaseModel):
    message: str = ""


# We import auth helpers - in production use proper dependency injection
def _get_user_id(authorization: Optional[str]) -> str:
    """Simple token extraction - mirrors auth.py logic."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    from app.api.auth import tokens_db, users_db
    token = authorization.replace("Bearer ", "")
    user_id = tokens_db.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


@router.get("/my-scripts")
async def list_my_scripts(authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    return [s for s in user_scripts_db.values() if s.get("user_id") == user_id]


@router.post("/publish/{script_id}")
async def publish_script(script_id: str, req: PublishRequest, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    script = user_scripts_db.get(script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your script")
    script["is_public"] = req.is_public
    script["status"] = "public" if req.is_public else "private"
    return script


@router.post("/submit/{script_id}")
async def submit_to_official(script_id: str, req: SubmitRequest = SubmitRequest(), authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    script = user_scripts_db.get(script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your script")
    if not script.get("is_public"):
        raise HTTPException(status_code=400, detail="Script must be public to submit")
    sub_id = str(uuid.uuid4())[:8]
    submissions_db[sub_id] = {
        "id": sub_id,
        "script_id": script_id,
        "user_id": user_id,
        "title": script.get("title", ""),
        "message": req.message,
        "status": "pending",
        "submitted_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    script["submitted"] = True
    return {"submission_id": sub_id, "status": "pending"}

@router.get("/public")
async def list_public_scripts():
    """List all publicly published user scripts."""
    return [
        {
            "id": s["id"],
            "title": s.get("title", "Untitled"),
            "description": s.get("description", ""),
            "style": s.get("style", "drama"),
            "author": s.get("author", "Anonymous"),
            "views_count": s.get("views_count", 0),
            "created_at": s.get("created_at", ""),
        }
        for s in user_scripts_db.values()
        if s.get("is_public")
    ]

