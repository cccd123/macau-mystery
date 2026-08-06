"""UGC user scripts API - save, publish, list, submit to official"""
import uuid
from datetime import datetime
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_service import authenticate_bearer
from app.db import get_db_session

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]

# User scripts store
user_scripts_db: dict[str, dict] = {}

# Submissions for admin review
submissions_db: dict[str, dict] = {}


class SaveScriptRequest(BaseModel):
    title: str
    description: str = ""
    chapters: list[dict[str, Any]] = []
    style: str = "drama"
    era: str = ""


class UpdateScriptRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    chapters: Optional[list[dict[str, Any]]] = None
    is_public: Optional[bool] = None
    status: Optional[str] = None


class PublishRequest(BaseModel):
    is_public: bool = False


class SubmitRequest(BaseModel):
    message: str = ""


# We import auth helpers - in production use proper dependency injection
async def _get_user_id(authorization: Optional[str], db: AsyncSession) -> str:
    user = await authenticate_bearer(db, authorization)
    await db.commit()
    return user.id


@router.get("/my-scripts")
async def list_my_scripts(db: DbSession, authorization: Optional[str] = Header(None)):
    user_id = await _get_user_id(authorization, db)
    return [s for s in user_scripts_db.values() if s.get("user_id") == user_id]


@router.post("/scripts")
async def save_script(req: SaveScriptRequest, db: DbSession, authorization: Optional[str] = Header(None)):
    user_id = await _get_user_id(authorization, db)
    script_id = str(uuid.uuid4())[:8]
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    script = {
        "id": script_id,
        "user_id": user_id,
        "title": req.title,
        "description": req.description,
        "chapters": req.chapters,
        "style": req.style,
        "era": req.era,
        "is_public": False,
        "status": "draft",
        "views_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    user_scripts_db[script_id] = script
    return script


@router.get("/scripts/{script_id}")
async def get_script(script_id: str, db: DbSession, authorization: Optional[str] = Header(None)):
    user_id = await _get_user_id(authorization, db)
    script = user_scripts_db.get(script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your script")
    return script


@router.put("/scripts/{script_id}")
async def update_script(script_id: str, req: UpdateScriptRequest, db: DbSession, authorization: Optional[str] = Header(None)):
    user_id = await _get_user_id(authorization, db)
    script = user_scripts_db.get(script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your script")
    if req.title is not None:
        script["title"] = req.title
    if req.description is not None:
        script["description"] = req.description
    if req.chapters is not None:
        script["chapters"] = req.chapters
    if req.is_public is not None:
        script["is_public"] = req.is_public
        script["status"] = "public" if req.is_public else "private"
    if req.status is not None:
        script["status"] = req.status
    script["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    return script


@router.post("/publish/{script_id}")
async def publish_script(script_id: str, req: PublishRequest, db: DbSession, authorization: Optional[str] = Header(None)):
    user_id = await _get_user_id(authorization, db)
    script = user_scripts_db.get(script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your script")
    script["is_public"] = req.is_public
    script["status"] = "public" if req.is_public else "private"
    return script


@router.post("/submit/{script_id}")
async def submit_to_official(script_id: str, db: DbSession, req: SubmitRequest = SubmitRequest(), authorization: Optional[str] = Header(None)):
    user_id = await _get_user_id(authorization, db)
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

