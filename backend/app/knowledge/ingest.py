"""Idempotent ingestion of the bundled Macau location knowledge into ChromaDB."""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

from app.ai.provider import create_embeddings
from app.knowledge.chroma_client import get_collection
from app.location_service import get_location_catalog


DOCS_DIR = Path(__file__).parent / "macau_docs"
DOC_FILES = {
    "a_ma_temple": "a_ma_temple.txt",
    "lilau_square": "lilau_square.txt",
    "mandarins_house": "zheng_house.txt",
    "dom_pedro_v_theatre": "dom_pedro_theatre.txt",
    "senado_square": "senado_square.txt",
    "ruins_of_st_pauls": "ruins_of_st_paul.txt",
}


@dataclass(frozen=True)
class KnowledgeChunk:
    id: str
    document: str
    metadata: dict[str, str | int]


def split_into_chunks(text: str, *, chunk_size: int = 320) -> list[str]:
    sentences = [part.strip() for part in re.split(r"(?<=[。！？\n])", text) if part.strip()]
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        if current and len(current) + len(sentence) > chunk_size:
            chunks.append(current)
            current = sentence
        else:
            current += sentence
    if current:
        chunks.append(current)
    return chunks


def build_knowledge_chunks() -> list[KnowledgeChunk]:
    chunks: list[KnowledgeChunk] = []
    for location in get_location_catalog().items:
        source_file = DOC_FILES[location.id]
        supplement = (DOCS_DIR / source_file).read_text(encoding="utf-8").strip()
        combined = f"{location.name}\n{location.description}\n{supplement}"
        for index, content in enumerate(split_into_chunks(combined)):
            digest = hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]
            chunks.append(
                KnowledgeChunk(
                    id=f"{location.id}_{index}_{digest}",
                    document=content,
                    metadata={
                        "location_id": location.id,
                        "location_name": location.name,
                        "source_title": location.source_title,
                        "source_url": str(location.source_url),
                        "source_file": source_file,
                        "chunk_index": index,
                    },
                )
            )
    return chunks


async def ingest_documents() -> int:
    collection = await asyncio.to_thread(get_collection)
    chunks = build_knowledge_chunks()
    desired_ids = {chunk.id for chunk in chunks}
    existing = await asyncio.to_thread(collection.get, include=[])
    existing_ids = set(existing.get("ids") or [])

    stale_ids = sorted(existing_ids - desired_ids)
    if stale_ids:
        await asyncio.to_thread(collection.delete, ids=stale_ids)

    missing = [chunk for chunk in chunks if chunk.id not in existing_ids]
    if missing:
        embeddings = await create_embeddings([chunk.document for chunk in missing])
        await asyncio.to_thread(
            collection.upsert,
            ids=[chunk.id for chunk in missing],
            documents=[chunk.document for chunk in missing],
            metadatas=[chunk.metadata for chunk in missing],
            embeddings=embeddings,
        )
    return len(chunks)


async def _main() -> None:
    parser = argparse.ArgumentParser(description="构建澳门历史 ChromaDB 知识索引")
    parser.parse_args()
    count = await ingest_documents()
    print(f"Knowledge index ready: {count} chunks")


if __name__ == "__main__":
    asyncio.run(_main())
