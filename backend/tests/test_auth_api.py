"""Integration coverage for persistent username/password authentication."""
from __future__ import annotations

import asyncio
from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from app.auth_service import bootstrap_demo_users, create_user
from app.config import get_settings
from app.db import create_database_engine, get_db_session
from app.db_models import AuthSession, Base, User, utc_now


class AuthHarness:
    def __init__(self, client: TestClient, session_factory: async_sessionmaker, engine: AsyncEngine) -> None:
        self.client = client
        self.session_factory = session_factory
        self.engine = engine


@pytest.fixture
def auth_api(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    database_url = f"sqlite+aiosqlite:///{(tmp_path / 'auth_api.db').as_posix()}"
    engine = create_database_engine(database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def prepare_database() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(prepare_database())
    monkeypatch.setenv("BOOTSTRAP_DEMO_STORY", "false")
    monkeypatch.setenv("BOOTSTRAP_DEMO_USERS", "false")
    get_settings.cache_clear()

    from app.main import create_app

    application = create_app()

    async def override_get_db_session():
        async with session_factory() as session:
            yield session

    application.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(application) as client:
        yield AuthHarness(client, session_factory, engine)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(harness: AuthHarness, username: str = "Explorer_1", password: str = "password1") -> dict:
    response = harness.client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": password, "nickname": "  Visitor  "},
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_register_login_me_and_persisted_session(auth_api: AuthHarness) -> None:
    registered = register(auth_api)
    assert registered["user"] == {
        "id": registered["user"]["id"],
        "username": "Explorer_1",
        "nickname": "Visitor",
        "role": "user",
    }
    assert registered["token"]

    duplicate = auth_api.client.post(
        "/api/v1/auth/register",
        json={"username": "explorer_1", "password": "password1", "nickname": "Again"},
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Username already exists"

    invalid_login = auth_api.client.post(
        "/api/v1/auth/login", json={"username": "EXPLORER_1", "password": "wrongpass"}
    )
    assert invalid_login.status_code == 401

    login = auth_api.client.post(
        "/api/v1/auth/login", json={"username": "EXPLORER_1", "password": "password1"}
    )
    assert login.status_code == 200
    assert login.json()["user"]["id"] == registered["user"]["id"]
    assert login.json()["token"] != registered["token"]

    me = auth_api.client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {registered['token']}"}
    )
    assert me.status_code == 200
    assert me.json() == registered["user"]

    from app.main import create_app

    restarted_app = create_app()

    async def override_restarted_db_session():
        async with auth_api.session_factory() as session:
            yield session

    restarted_app.dependency_overrides[get_db_session] = override_restarted_db_session
    with TestClient(restarted_app) as restarted_client:
        resumed = restarted_client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {registered['token']}"}
        )
    assert resumed.status_code == 200
    assert resumed.json() == registered["user"]

    async def verify_storage() -> None:
        async with auth_api.session_factory() as session:
            user = await session.scalar(select(User).where(User.id == registered["user"]["id"]))
            sessions = list((await session.scalars(select(AuthSession).where(AuthSession.user_id == user.id))).all())
        assert user is not None
        assert user.password_hash != "password1"
        assert user.username_key == "explorer_1"
        assert len(sessions) == 2
        assert all(item.token_digest != registered["token"] for item in sessions)

    asyncio.run(verify_storage())


def test_expired_token_and_role_guards(auth_api: AuthHarness) -> None:
    member = register(auth_api, username="member_one")

    async def create_admin() -> None:
        async with auth_api.session_factory.begin() as session:
            await create_user(
                session, username="admin_one", password="password1", nickname="Admin One", role="admin"
            )

    asyncio.run(create_admin())
    admin_login = auth_api.client.post(
        "/api/v1/auth/login", json={"username": "admin_one", "password": "password1"}
    )
    assert admin_login.status_code == 200

    forbidden = auth_api.client.post(
        "/api/v1/admin/scripts",
        json={"title": "Not allowed"},
        headers={"Authorization": f"Bearer {member['token']}"},
    )
    assert forbidden.status_code == 403
    allowed = auth_api.client.post(
        "/api/v1/admin/scripts",
        json={"title": "Allowed"},
        headers={"Authorization": f"Bearer {admin_login.json()['token']}"},
    )
    assert allowed.status_code == 200
    ugc = auth_api.client.get(
        "/api/v1/ugc/my-scripts", headers={"Authorization": f"Bearer {member['token']}"}
    )
    assert ugc.status_code == 200

    async def expire_member_token() -> None:
        async with auth_api.session_factory.begin() as session:
            auth_session = await session.scalar(
                select(AuthSession).where(AuthSession.user_id == member["user"]["id"])
            )
            auth_session.expires_at = utc_now() - timedelta(seconds=1)

    asyncio.run(expire_member_token())
    expired = auth_api.client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {member['token']}"}
    )
    assert expired.status_code == 401


def test_registration_accepts_the_frontend_minimum_password_length(auth_api: AuthHarness) -> None:
    response = auth_api.client.post(
        "/api/v1/auth/register",
        json={"username": "six_char", "password": "123456", "nickname": "Six"},
    )
    assert response.status_code == 200, response.text

    too_short = auth_api.client.post(
        "/api/v1/auth/register",
        json={"username": "five_char", "password": "12345", "nickname": "Five"},
    )
    assert too_short.status_code == 422


def test_development_demo_seed_is_idempotent(auth_api: AuthHarness, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BOOTSTRAP_DEMO_USERS", "true")
    monkeypatch.setenv("DEMO_ADMIN_USERNAME", "admin")
    monkeypatch.setenv("DEMO_ADMIN_PASSWORD", "admin123")
    monkeypatch.setenv("DEMO_GUEST_USERNAME", "guest")
    monkeypatch.setenv("DEMO_GUEST_PASSWORD", "guest123")
    get_settings.cache_clear()
    monkeypatch.setattr("app.auth_service.SessionLocal", auth_api.session_factory)

    asyncio.run(bootstrap_demo_users())
    asyncio.run(bootstrap_demo_users())

    async def verify_seeded_users() -> None:
        async with auth_api.session_factory() as session:
            users = list((await session.scalars(select(User).order_by(User.username_key))).all())
        assert [(user.username, user.role) for user in users] == [("admin", "admin"), ("guest", "user")]

    asyncio.run(verify_seeded_users())
