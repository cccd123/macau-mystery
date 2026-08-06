"""Bounded process-local cache supporting anonymous screenplay regeneration."""
from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass
from threading import Lock

from app.config import get_settings
from app.models import GenerateRequest, GenerateResponse


@dataclass(frozen=True)
class CachedGeneration:
    request: GenerateRequest
    response: GenerateResponse


_cache: OrderedDict[str, CachedGeneration] = OrderedDict()
_lock = Lock()


def store_generation(request: GenerateRequest, response: GenerateResponse) -> None:
    cached = CachedGeneration(
        request=request.model_copy(deep=True),
        response=response.model_copy(deep=True),
    )
    with _lock:
        _cache[response.script_id] = cached
        _cache.move_to_end(response.script_id)
        limit = get_settings().generated_script_cache_size
        while len(_cache) > limit:
            _cache.popitem(last=False)


def get_generation(script_id: str) -> CachedGeneration | None:
    with _lock:
        cached = _cache.get(script_id)
        if cached is None:
            return None
        _cache.move_to_end(script_id)
        return CachedGeneration(
            request=cached.request.model_copy(deep=True),
            response=cached.response.model_copy(deep=True),
        )


def clear_generation_cache() -> None:
    with _lock:
        _cache.clear()
