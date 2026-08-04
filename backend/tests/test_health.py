"""Health endpoint coverage for the persistent database connection."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.config import get_settings


def test_health_reports_database_connection(monkeypatch) -> None:
    monkeypatch.setenv("BOOTSTRAP_DEMO_STORY", "false")
    monkeypatch.setenv("BOOTSTRAP_DEMO_USERS", "false")
    get_settings.cache_clear()
    try:
        from app.main import create_app

        with TestClient(create_app()) as client:
            response = client.get("/api/v1/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok", "database": "ok", "version": "0.2.0"}
    finally:
        get_settings.cache_clear()
