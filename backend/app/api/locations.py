"""Anonymous, read-only API for the fixed Macau heritage route."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.location_service import LocationDetail, LocationSummary, find_location, list_location_summaries


router = APIRouter()


class LocationListResponse(BaseModel):
    items: list[LocationSummary]


@router.get("", response_model=LocationListResponse)
async def list_locations() -> LocationListResponse:
    return LocationListResponse(items=list_location_summaries())


@router.get("/{location_id}", response_model=LocationDetail)
async def get_location(location_id: str) -> LocationDetail:
    location = find_location(location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location
