"""Anonymous API for the fixed Macau heritage route, including RAG Q&A."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.knowledge.rag_service import ask_about_location
from app.location_service import LocationDetail, LocationSummary, find_location, list_location_summaries


router = APIRouter()


class LocationListResponse(BaseModel):
    items: list[LocationSummary]


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    source: str = ""


@router.get("", response_model=LocationListResponse)
async def list_locations() -> LocationListResponse:
    return LocationListResponse(items=list_location_summaries())


@router.get("/{location_id}", response_model=LocationDetail)
async def get_location(location_id: str) -> LocationDetail:
    location = find_location(location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.post("/{location_id}/ask", response_model=AskResponse)
async def ask_location(location_id: str, req: AskRequest) -> AskResponse:
    location = find_location(location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    result = await ask_about_location(location_id, req.question)
    return AskResponse(answer=result["answer"], source=result["source"])
