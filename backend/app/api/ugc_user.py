"""UGC user scripts API - publish, list, submit to official"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Annotated, Optional
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
