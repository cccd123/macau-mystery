"""Persistent user, password, and bearer-token helpers."""
from __future__ import annotations

import hashlib
import re
import secrets
from datetime import timedelta

from fastapi import HTTPException
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import get_settings
from app.db import SessionLocal
from app.db_models import AuthSession, User, utc_now


USERNAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_]{2,31}$")
PASSWORD_MIN_LENGTH = 6
PASSWORD_MAX_LENGTH = 128
NICKNAME_MAX_LENGTH = 64
password_hasher = PasswordHash.recommended()


def validate_username(value: str) -> str:
    username = value.strip()
    if not USERNAME_PATTERN.fullmatch(username):
        raise ValueError("用户名须为 3 至 32 位字母、数字或下划线，且以字母开头")
    return username


def normalize_username(username: str) -> str:
    return username.casefold()


def validate_password(value: str) -> str:
    if not PASSWORD_MIN_LENGTH <= len(value) <= PASSWORD_MAX_LENGTH:
        raise ValueError(f"密码长度须为 {PASSWORD_MIN_LENGTH} 至 {PASSWORD_MAX_LENGTH} 位")
    return value


def normalize_nickname(value: str, *, fallback: str) -> str:
    nickname = value.strip() or fallback
    if len(nickname) > NICKNAME_MAX_LENGTH:
        raise ValueError(f"昵称不能超过 {NICKNAME_MAX_LENGTH} 个字符")
    return nickname


def _token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_token() -> str:
    return secrets.token_urlsafe(32)


async def find_user_by_username(session: AsyncSession, username: str) -> User | None:
    return await session.scalar(select(User).where(User.username_key == normalize_username(username)))


async def create_user(
    session: AsyncSession,
    *,
    username: str,
    password: str,
    nickname: str,
    role: str = "user",
) -> User:
    user = User(
        username=username,
        username_key=normalize_username(username),
        nickname=nickname,
        password_hash=password_hasher.hash(password),
        role=role,
    )
    session.add(user)
    await session.flush()
    return user


async def create_auth_session(session: AsyncSession, user: User) -> str:
    settings = get_settings()
    token = _new_token()
    now = utc_now()
    session.add(
        AuthSession(
            token_digest=_token_digest(token),
            user_id=user.id,
            created_at=now,
            last_used_at=now,
            expires_at=now + timedelta(hours=settings.auth_token_ttl_hours),
        )
    )
    await session.flush()
    return token


async def authenticate_bearer(session: AsyncSession, authorization: str | None) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    now = utc_now()
    auth_session = await session.scalar(
        select(AuthSession)
        .options(joinedload(AuthSession.user))
        .join(AuthSession.user)
        .where(
            AuthSession.token_digest == _token_digest(token),
            AuthSession.expires_at > now,
            User.is_active.is_(True),
        )
    )
    if auth_session is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    auth_session.last_used_at = now
    return auth_session.user


async def require_admin(session: AsyncSession, authorization: str | None) -> User:
    user = await authenticate_bearer(session, authorization)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def bootstrap_demo_users() -> None:
    """Create missing development-only demo accounts without changing existing users."""
    settings = get_settings()
    accounts = (
        (settings.demo_admin_username, settings.demo_admin_password, "Admin", "admin"),
        (settings.demo_guest_username, settings.demo_guest_password, "Guest Player", "user"),
    )
    async with SessionLocal.begin() as session:
        for username, password, nickname, role in accounts:
            validated_username = validate_username(username)
            validate_password(password)
            existing = await find_user_by_username(session, validated_username)
            if existing is None:
                await create_user(
                    session,
                    username=validated_username,
                    password=password,
                    nickname=nickname,
                    role=role,
                )
