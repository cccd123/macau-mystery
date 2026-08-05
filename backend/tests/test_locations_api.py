"""Coverage for the fixed, anonymous Macau route catalogue."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.config import get_settings
from app.location_service import get_location_catalog


def test_location_catalog_has_six_ordered_unique_locations() -> None:
    catalog = get_location_catalog()
    assert len(catalog.items) == 6
    assert [item.order for item in catalog.items] == [1, 2, 3, 4, 5, 6]
    assert len({item.id for item in catalog.items}) == 6
    assert len({(item.coordinates.lat, item.coordinates.lng) for item in catalog.items}) == 6
    assert [item.summary for item in catalog.items] == [
        "澳门现存最古老的庙宇之一",
        "葡萄牙人在澳门最早的聚居点",
        "晚清思想家郑观应故居",
        "中国现存最古老的西式剧院",
        "澳门的城市中心广场",
        "澳门最著名的地标建筑",
    ]
    assert all(120 <= len(item.description) <= 200 for item in catalog.items)
    assert all(item.source_title and item.source_url for item in catalog.items)


def test_location_list_detail_and_not_found_are_public(monkeypatch) -> None:
    monkeypatch.setenv("BOOTSTRAP_DEMO_STORY", "false")
    monkeypatch.setenv("BOOTSTRAP_DEMO_USERS", "false")
    monkeypatch.setenv("OBJECT_STORAGE_ENABLED", "false")
    get_settings.cache_clear()
    try:
        from app.main import create_app

        with TestClient(create_app()) as client:
            listed = client.get("/api/v1/locations")
            detail = client.get("/api/v1/locations/a_ma_temple")
            missing = client.get("/api/v1/locations/unknown_location")

        assert listed.status_code == 200
        items = listed.json()["items"]
        assert [item["id"] for item in items] == [
            "a_ma_temple",
            "lilau_square",
            "mandarins_house",
            "dom_pedro_v_theatre",
            "senado_square",
            "ruins_of_st_pauls",
        ]
        assert "description" not in items[0]
        assert detail.status_code == 200
        assert detail.json()["name"] == "妈阁庙"
        assert detail.json()["description"]
        assert detail.json()["coordinates"] == {"lat": 22.1867, "lng": 113.5318}
        assert missing.status_code == 404
        assert missing.json() == {"detail": "Location not found"}
    finally:
        get_settings.cache_clear()
