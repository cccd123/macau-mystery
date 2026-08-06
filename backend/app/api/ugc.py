"""Anonymous one-sentence screenplay generation API."""
from __future__ import annotations

from fastapi import APIRouter

from app.ai import script_generation
from app.ai.generation_cache import get_generation, store_generation
from app.generation_errors import GeneratedScriptNotFound
from app.models import GenerateRequest, GenerateResponse


router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate_drama(request: GenerateRequest) -> GenerateResponse:
    """Generate a Chinese multi-act screenplay grounded in Macau history."""
    response = await script_generation.generate_screenplay(request)
    store_generation(request, response)
    return response


@router.post("/regenerate/{script_id}", response_model=GenerateResponse)
async def regenerate_drama(script_id: str) -> GenerateResponse:
    cached = get_generation(script_id)
    if cached is None:
        raise GeneratedScriptNotFound(script_id)
    response = await script_generation.generate_screenplay(cached.request, script_id=script_id)
    store_generation(cached.request, response)
    return response
