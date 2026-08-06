"""Retrieval-augmented context for Macau historical script generation."""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field

from app.ai.provider import create_embeddings, provider_is_configured
from app.config import get_settings
from app.knowledge.chroma_client import get_collection
from app.knowledge.ingest import ingest_documents


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RagHit:
    chunk_id: str
    document: str
    title: str
    source_url: str | None
    location_id: str | None
    distance: float | None


@dataclass(frozen=True)
class RagResult:
    used: bool
    degraded: bool
    hits: list[RagHit] = field(default_factory=list)


async def retrieve_macau_history(query: str) -> RagResult:
    settings = get_settings()
    if not settings.rag_enabled or not provider_is_configured(settings.siliconflow_api_key):
        return RagResult(used=False, degraded=True)

    try:
        collection = await asyncio.to_thread(get_collection)
        count = await asyncio.to_thread(collection.count)
        if count == 0:
            count = await ingest_documents()
        if count == 0:
            return RagResult(used=False, degraded=True)

        query_embedding = (await create_embeddings([query]))[0]
        raw = await asyncio.to_thread(
            collection.query,
            query_embeddings=[query_embedding],
            n_results=min(settings.rag_top_k, count),
            include=["documents", "metadatas", "distances"],
        )
        ids = (raw.get("ids") or [[]])[0]
        documents = (raw.get("documents") or [[]])[0]
        metadatas = (raw.get("metadatas") or [[]])[0]
        distances = (raw.get("distances") or [[]])[0]
        hits = []
        for index, chunk_id in enumerate(ids):
            metadata = metadatas[index] or {}
            hits.append(
                RagHit(
                    chunk_id=chunk_id,
                    document=documents[index] or "",
                    title=str(metadata.get("source_title") or metadata.get("location_name") or "澳门历史资料"),
                    source_url=metadata.get("source_url"),
                    location_id=metadata.get("location_id"),
                    distance=float(distances[index]) if index < len(distances) else None,
                )
            )
        return RagResult(used=bool(hits), degraded=not hits, hits=hits)
    except Exception:
        logger.warning("Macau history retrieval failed; falling back to LLM-only generation", exc_info=True)
        return RagResult(used=False, degraded=True)


async def rag_query(query: str, location: str = "") -> list[str]:
    """Compatibility wrapper used by older AI modules."""
    result = await retrieve_macau_history(f"{query}\n{location}".strip())
    return [hit.document for hit in result.hits]
