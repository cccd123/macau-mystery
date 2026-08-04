"""Persistent username/password authentication API."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_service import (
    create_auth_session,
    create_user,
    find_user_by_username,
    normalize_nickname,
    password_hasher,
    validate_password,
    validate_username,
)
from app.db import get_db_session
from app.db_models import User


router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


class LoginRequest(BaseModel):
    username: str
    password: str

    _validate_username = field_validator("username")(validate_username)
    _validate_password = field_validator("password")(validate_password)


class RegisterRequest(LoginRequest):
    nickname: str = ""

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, value: str) -> str:
        # The fallback username is applied after the username validator has run.
        if len(value.strip()) > 64:
            raise ValueError("昵称不能超过 64 个字符")
        return value


class UserResponse(BaseModel):
    id: str
    username: str
    nickname: str
    role: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


def as_user_response(user: User) -> UserResponse:
    return UserResponse(id=user.id, username=user.username, nickname=user.nickname, role=user.role)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: DbSession) -> AuthResponse:
    user = await find_user_by_username(db, req.username)
    if user is None or not user.is_active or not password_hasher.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = await create_auth_session(db, user)
    await db.commit()
    return AuthResponse(token=token, user=as_user_response(user))


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: DbSession) -> AuthResponse:
    nickname = normalize_nickname(req.nickname, fallback=req.username)
    try:
        async with db.begin():
            existing = await find_user_by_username(db, req.username)
            if existing is not None:
                raise HTTPException(status_code=409, detail="Username already exists")
            user = await create_user(db, username=req.username, password=req.password, nickname=nickname)
            token = await create_auth_session(db, user)
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Username already exists") from exc
    return AuthResponse(token=token, user=as_user_response(user))


@router.get("/me", response_model=UserResponse)
async def get_me(db: DbSession, authorization: Annotated[str | None, Header()] = None) -> UserResponse:
    from app.auth_service import authenticate_bearer

    user = await authenticate_bearer(db, authorization)
    await db.commit()
    return as_user_response(user)
