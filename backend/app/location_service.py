"""Validated, read-only catalogue for the six public route locations."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


CATALOG_PATH = Path(__file__).with_name("locations.zh-CN.json")


class LocationModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Coordinates(LocationModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class LocationDetail(LocationModel):
    id: str = Field(min_length=2, max_length=64, pattern=r"^[a-z][a-z0-9_]*$")
    order: int = Field(ge=1)
    name: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    description: str = Field(min_length=1)
    coordinates: Coordinates
    source_title: str = Field(min_length=1)
    source_url: HttpUrl


class LocationSummary(LocationModel):
    id: str
    order: int
    name: str
    summary: str
    coordinates: Coordinates


class LocationCatalog(LocationModel):
    items: list[LocationDetail] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_ids_and_order(self) -> "LocationCatalog":
        ids = [item.id for item in self.items]
        orders = [item.order for item in self.items]
        if len(ids) != len(set(ids)):
            raise ValueError("location ids must be unique")
        if len(orders) != len(set(orders)):
            raise ValueError("location order values must be unique")
        return self


@lru_cache
def get_location_catalog() -> LocationCatalog:
    data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    catalog = LocationCatalog.model_validate(data)
    return LocationCatalog(items=sorted(catalog.items, key=lambda item: item.order))


def list_location_summaries() -> list[LocationSummary]:
    return [
        LocationSummary(
            id=item.id,
            order=item.order,
            name=item.name,
            summary=item.summary,
            coordinates=item.coordinates,
        )
        for item in get_location_catalog().items
    ]


def find_location(location_id: str) -> LocationDetail | None:
    return next((item for item in get_location_catalog().items if item.id == location_id), None)
