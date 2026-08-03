"""End-to-end coverage for the persistent version 1 game API."""
from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from app.config import get_settings
from app.db import create_database_engine, get_db_session
from app.db_models import Base
from app.game_errors import GameError
from app.game_service import GameService
from app.models import ChoiceRequest
from app.story.importer import import_story_data


DEMO_PATH = Path(__file__).resolve().parents[1] / "app" / "story" / "scripts" / "macau_mystery_demo.json"


def demo_data() -> dict:
    return json.loads(DEMO_PATH.read_text(encoding="utf-8"))


@dataclass
class ApiHarness:
    client: TestClient
    session_factory: async_sessionmaker
    engine: AsyncEngine


@pytest.fixture
def game_api(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    database_url = f"sqlite+aiosqlite:///{(tmp_path / 'game_api.db').as_posix()}"
    engine = create_database_engine(database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def prepare_database() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with session_factory() as session:
            await import_story_data(
                session, demo_data(), publish=True, allow_placeholder_media=True
            )

    asyncio.run(prepare_database())
    monkeypatch.setenv("BOOTSTRAP_DEMO_STORY", "false")
    get_settings.cache_clear()

    from app.main import create_app

    application = create_app()

    async def override_get_db_session():
        async with session_factory() as session:
            yield session

    application.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(application) as client:
        yield ApiHarness(client=client, session_factory=session_factory, engine=engine)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def start_demo(harness: ApiHarness) -> dict:
    response = harness.client.post("/api/v1/game/start", json={"script_id": "macau_mystery_demo"})
    assert response.status_code == 201, response.text
    return response.json()


def choose(harness: ApiHarness, snapshot: dict, choice_id: str, request_id: str | None = None):
    return harness.client.post(
        "/api/v1/game/choice",
        json={
            "session_id": snapshot["session_id"],
            "scene_id": snapshot["scene"]["id"],
            "choice_id": choice_id,
            "request_id": request_id or str(uuid.uuid4()),
        },
    )


def test_start_choice_merge_ending_and_replay(game_api: ApiHarness) -> None:
    started = start_demo(game_api)
    assert started["status"] == "active"
    assert started["scene"]["id"] == "scene_start"
    assert {choice["preload"]["scene_id"] for choice in started["scene"]["choices"]} == {
        "scene_letter",
        "scene_direct",
    }

    inspected_response = choose(game_api, started, "inspect_letter")
    assert inspected_response.status_code == 200, inspected_response.text
    inspected = inspected_response.json()
    assert inspected["scene"]["id"] == "scene_letter"
    assert [clue["id"] for clue in inspected["awarded_clues"]] == ["letter_fragment"]
    assert [clue["id"] for clue in inspected["clues"]] == ["letter_fragment"]

    merged_response = choose(game_api, inspected, "continue_with_clue")
    assert merged_response.status_code == 200, merged_response.text
    merged = merged_response.json()
    assert merged["scene"]["id"] == "scene_merge"

    finish_request_id = str(uuid.uuid4())
    ending_response = choose(game_api, merged, "draw_conclusion", finish_request_id)
    assert ending_response.status_code == 200, ending_response.text
    ending = ending_response.json()
    assert ending["status"] == "completed"
    assert ending["scene"]["type"] == "ending"
    assert ending["ending"] == {"id": "ending_good", "code": "good"}
    assert ending["scene"]["choices"] == []

    replay_response = choose(game_api, merged, "draw_conclusion", finish_request_id)
    assert replay_response.status_code == 200
    assert replay_response.json() == ending

    completed_response = choose(game_api, ending, "draw_conclusion")
    assert completed_response.status_code == 409
    assert completed_response.json()["error"]["code"] == "SESSION_COMPLETED"


def test_state_recovery_stale_scene_and_idempotency_conflict(game_api: ApiHarness) -> None:
    started = start_demo(game_api)
    request_id = str(uuid.uuid4())
    first_response = choose(game_api, started, "leave_quietly", request_id)
    assert first_response.status_code == 200
    direct = first_response.json()
    assert direct["scene"]["id"] == "scene_direct"

    recovered_response = game_api.client.get(f"/api/v1/game/state/{started['session_id']}")
    assert recovered_response.status_code == 200
    assert recovered_response.json()["scene"]["id"] == "scene_direct"
    assert "awarded_clues" not in recovered_response.json()

    stale_response = choose(game_api, started, "leave_quietly")
    assert stale_response.status_code == 409
    assert stale_response.json()["error"]["code"] == "STALE_SCENE"

    conflict_response = choose(game_api, started, "inspect_letter", request_id)
    assert conflict_response.status_code == 409
    assert conflict_response.json()["error"]["code"] == "IDEMPOTENCY_CONFLICT"


def test_story_versions_are_pinned_to_the_session(game_api: ApiHarness) -> None:
    first = start_demo(game_api)

    revised = demo_data()
    revised["description"] = "第二个已发布版本。"

    async def publish_revision() -> None:
        async with game_api.session_factory() as session:
            await import_story_data(
                session, revised, publish=True, allow_placeholder_media=True
            )

    asyncio.run(publish_revision())
    recovered = game_api.client.get(f"/api/v1/game/state/{first['session_id']}")
    second = start_demo(game_api)

    assert recovered.status_code == 200
    assert recovered.json()["story"]["version"] == 1
    assert second["story"]["version"] == 2


def test_game_errors_and_validation_use_the_contract_envelope(game_api: ApiHarness) -> None:
    missing_story = game_api.client.post("/api/v1/game/start", json={"script_id": "not_found"})
    assert missing_story.status_code == 404
    assert missing_story.json()["error"]["code"] == "STORY_NOT_FOUND"

    missing_session = game_api.client.get(f"/api/v1/game/state/{uuid.uuid4()}")
    assert missing_session.status_code == 404
    assert missing_session.json()["error"]["code"] == "SESSION_NOT_FOUND"

    invalid_request = game_api.client.post("/api/v1/game/choice", json={"session_id": "not-a-uuid"})
    assert invalid_request.status_code == 422
    assert invalid_request.json()["error"]["code"] == "VALIDATION_ERROR"


def test_concurrent_choices_advance_a_sqlite_session_at_most_once(game_api: ApiHarness) -> None:
    started = start_demo(game_api)

    async def submit(choice_id: str) -> tuple[str, str]:
        async with game_api.session_factory() as session:
            request = ChoiceRequest(
                session_id=started["session_id"],
                scene_id="scene_start",
                choice_id=choice_id,
                request_id=uuid.uuid4(),
            )
            try:
                snapshot = await GameService(session).make_choice(request)
                return "ok", snapshot.scene.id
            except GameError as exc:
                return "error", exc.code

    async def run_concurrently() -> list[tuple[str, str]]:
        return await asyncio.gather(submit("inspect_letter"), submit("leave_quietly"))

    outcomes = asyncio.run(run_concurrently())
    assert sorted(result[0] for result in outcomes) == ["error", "ok"]
    assert {result[1] for result in outcomes} & {"scene_letter", "scene_direct"}
    assert ("error", "STALE_SCENE") in outcomes
