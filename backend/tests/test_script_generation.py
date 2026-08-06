"""Coverage for anonymous RAG-backed Macau screenplay generation."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.ai.generation_cache import clear_generation_cache
from app.ai.rag_engine import RagHit, RagResult, retrieve_macau_history
from app.ai.script_generation import generate_screenplay
from app.config import get_settings
from app.knowledge.chroma_client import clear_chroma_client_cache, get_collection
from app.knowledge.ingest import ingest_documents
from app.knowledge.ingest import build_knowledge_chunks
from app.models import GenerateRequest, GenerateResponse, RagMetadata


def draft_json(*, title: str = "潮声旧影", acts: int = 3) -> str:
    return json.dumps(
        {
            "title": title,
            "summary": "一封旧信把两代澳门人的命运重新连接。",
            "characters": [
                {"name": "阿澄", "description": "寻找家族往事的青年。"},
                {"name": "梁伯", "description": "熟悉内港历史的老人。"},
            ],
            "acts": [
                {
                    "title": f"第{index}幕：潮痕",
                    "scenes": [
                        {
                            "title": "石阶重逢",
                            "location": "妈阁庙",
                            "narration": "海风吹过石阶，阿澄展开泛黄的信纸。",
                            "dialogues": [
                                {
                                    "character": "梁伯",
                                    "line": "有些故事，要从这片海开始讲。",
                                    "stage_direction": "望向内港",
                                }
                            ],
                        }
                    ],
                }
                for index in range(1, acts + 1)
            ],
        },
        ensure_ascii=False,
    )


def test_generate_screenplay_uses_rag_and_renders_text() -> None:
    captured: dict[str, str] = {}

    async def retrieve(query: str) -> RagResult:
        assert "澳门历史短剧" in query
        return RagResult(
            used=True,
            degraded=False,
            hits=[
                RagHit(
                    chunk_id="a_ma_0",
                    document="妈阁庙依山面海，与澳门早期航海文化密切相关。",
                    title="澳门旅游局：妈阁庙",
                    source_url="https://example.com/a-ma",
                    location_id="a_ma_temple",
                    distance=0.1,
                )
            ],
        )

    async def complete(system: str, user: str) -> str:
        captured["system"] = system
        captured["user"] = user
        return draft_json()

    request = GenerateRequest.model_validate(
        {
            "input": "一个年轻人发现祖辈旧信",
            "style": "suspense",
            "options": {"era": "qing", "acts": 3},
        }
    )
    response = asyncio.run(
        generate_screenplay(
            request,
            retriever=retrieve,
            completion=complete,
            repair_completion=complete,
        )
    )

    assert response.title == "潮声旧影"
    assert response.era == "清代"
    assert response.demo_mode is False
    assert len(response.chapters) == 3
    assert "《潮声旧影》" in response.content
    assert "梁伯（望向内港）：有些故事" in response.content
    assert response.rag.used is True
    assert response.rag.sources[0].chunk_id == "a_ma_0"
    assert "必须以澳门历史" in captured["system"]
    assert "妈阁庙依山面海" in captured["user"]


def test_invalid_model_output_gets_one_repair_attempt() -> None:
    calls: list[str] = []

    async def retrieve(_query: str) -> RagResult:
        return RagResult(used=False, degraded=True)

    async def invalid(_system: str, _user: str) -> str:
        calls.append("initial")
        return "not json"

    async def repair(_system: str, user: str) -> str:
        calls.append("repair")
        assert "校验错误" in user
        return draft_json(acts=5)

    request = GenerateRequest(
        input="澳门老街中的误会",
        style="comedy",
        options={"era": "modern", "acts": 5},
    )
    response = asyncio.run(
        generate_screenplay(
            request,
            retriever=retrieve,
            completion=invalid,
            repair_completion=repair,
        )
    )
    assert calls == ["initial", "repair"]
    assert len(response.chapters) == 5
    assert response.rag == RagMetadata(used=False, degraded=True, sources=[])


def test_bundled_knowledge_covers_six_locations() -> None:
    chunks = build_knowledge_chunks()
    location_ids = {str(chunk.metadata["location_id"]) for chunk in chunks}
    assert location_ids == {
        "a_ma_temple",
        "lilau_square",
        "mandarins_house",
        "dom_pedro_v_theatre",
        "senado_square",
        "ruins_of_st_pauls",
    }
    assert len({chunk.id for chunk in chunks}) == len(chunks)
    assert all(chunk.metadata["source_url"] for chunk in chunks)


def test_chroma_ingestion_is_persistent_and_idempotent(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    embedding_calls: list[list[str]] = []

    async def fake_embeddings(texts: list[str]) -> list[list[float]]:
        embedding_calls.append(texts)
        return [[float(index + 1), 0.5, 0.25] for index, _text in enumerate(texts)]

    monkeypatch.setenv("CHROMA_PERSIST_PATH", str(tmp_path / "chroma"))
    monkeypatch.setenv("EMBEDDING_MODEL", "test/embedding-model")
    monkeypatch.setenv("SILICONFLOW_API_KEY", "sk-test")
    monkeypatch.setattr("app.knowledge.ingest.create_embeddings", fake_embeddings)
    monkeypatch.setattr("app.ai.rag_engine.create_embeddings", fake_embeddings)
    get_settings.cache_clear()
    clear_chroma_client_cache()
    try:
        first_count = asyncio.run(ingest_documents())
        second_count = asyncio.run(ingest_documents())
        assert first_count == second_count
        assert get_collection().count() == first_count
        assert len(embedding_calls) == 1
        retrieval = asyncio.run(retrieve_macau_history("妈阁庙与航海历史"))
        assert retrieval.used is True
        assert retrieval.degraded is False
        assert retrieval.hits
        assert retrieval.hits[0].source_url
    finally:
        clear_chroma_client_cache()
        get_settings.cache_clear()


def test_rag_disabled_degrades_without_accessing_chroma(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RAG_ENABLED", "false")
    get_settings.cache_clear()
    try:
        result = asyncio.run(retrieve_macau_history("澳门历史"))
        assert result == RagResult(used=False, degraded=True)
    finally:
        get_settings.cache_clear()


@pytest.fixture
def generation_api(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("BOOTSTRAP_DEMO_STORY", "false")
    monkeypatch.setenv("BOOTSTRAP_DEMO_USERS", "false")
    monkeypatch.setenv("OBJECT_STORAGE_ENABLED", "false")
    get_settings.cache_clear()
    clear_generation_cache()

    from app.main import create_app

    with TestClient(create_app()) as client:
        yield client

    clear_generation_cache()
    get_settings.cache_clear()


def test_generate_and_regenerate_are_anonymous_and_keep_contract(
    generation_api: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.api import ugc as generation_api_module

    call_count = 0

    async def fake_generate(request: GenerateRequest, *, script_id: str | None = None) -> GenerateResponse:
        nonlocal call_count
        call_count += 1
        return _fake_response_payload(request, script_id, call_count)

    monkeypatch.setattr(generation_api_module.script_generation, "generate_screenplay", fake_generate)
    response = generation_api.post(
        "/api/v1/create/generate",
        json={
            "input": "码头商人的旧怀表",
            "style": "suspense",
            "options": {"era": "qing", "acts": 3},
        },
    )
    assert response.status_code == 200, response.text
    generated = response.json()
    assert generated["script_id"]
    assert generated["title"] == "第1版"
    assert generated["content"]
    assert generated["chapters"] == []
    assert generated["rag"] == {"used": False, "degraded": True, "sources": []}

    regenerated_response = generation_api.post(
        f"/api/v1/create/regenerate/{generated['script_id']}"
    )
    assert regenerated_response.status_code == 200
    regenerated = regenerated_response.json()
    assert regenerated["script_id"] == generated["script_id"]
    assert regenerated["title"] == "第2版"
    assert call_count == 2


def _fake_response_payload(
    request: GenerateRequest, script_id: str | None, revision: int
) -> GenerateResponse:
    return GenerateResponse(
        script_id=script_id or "5a9ca2c4-33cc-4428-b442-67be0c099fd9",
        title=f"第{revision}版",
        content="完整中文剧本文本",
        chapters=[],
        style=request.style,
        era="清代",
        rag=RagMetadata(used=False, degraded=True),
    )


def test_regenerate_missing_cache_returns_structured_404(generation_api: TestClient) -> None:
    response = generation_api.post("/api/v1/create/regenerate/missing")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "GENERATED_SCRIPT_NOT_FOUND"


def test_generate_without_provider_configuration_returns_503(
    generation_api: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SILICONFLOW_API_KEY", "")
    get_settings.cache_clear()
    response = generation_api.post(
        "/api/v1/create/generate",
        json={"input": "一封来自澳门旧码头的信", "options": None},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AI_SERVICE_NOT_CONFIGURED"


@pytest.mark.parametrize(
    "payload",
    [
        {"input": "   "},
        {"input": "故事", "style": "unknown"},
        {"input": "故事", "options": {"acts": 4}},
        {"input": "故事", "options": {"era": "qing", "unknown": True}},
    ],
)
def test_generate_request_validation(generation_api: TestClient, payload: dict) -> None:
    response = generation_api.post("/api/v1/create/generate", json=payload)
    assert response.status_code == 422


def test_openapi_exposes_extended_generation_contract(generation_api: TestClient) -> None:
    schemas = generation_api.get("/openapi.json").json()["components"]["schemas"]
    request_schema = schemas["GenerateRequest"]
    response_schema = schemas["GenerateResponse"]
    assert request_schema["required"] == ["input"]
    assert {"content", "chapters", "rag"}.issubset(response_schema["properties"])
