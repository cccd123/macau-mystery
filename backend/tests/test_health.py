"""Health endpoint coverage for the persistent database connection."""
from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_database_connection() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok", "version": "0.2.0"}
