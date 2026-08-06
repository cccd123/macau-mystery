"""Persistent ChromaDB collection management for Macau history knowledge."""
from __future__ import annotations

import hashlib
from functools import lru_cache

import chromadb

from app.config import get_settings


def collection_name(embedding_model: str) -> str:
    model_hash = hashlib.sha256(embedding_model.encode("utf-8")).hexdigest()[:12]
    return f"macau_history_{model_hash}"


@lru_cache(maxsize=4)
def _get_client(path: str):
    return chromadb.PersistentClient(path=path)


@lru_cache(maxsize=8)
def _get_collection(path: str, embedding_model: str):
    client = _get_client(path)
    return client.get_or_create_collection(
        name=collection_name(embedding_model),
        embedding_function=None,
        metadata={
            "description": "澳门六处历史景点知识库",
            "embedding_model": embedding_model,
            "hnsw:space": "cosine",
        },
    )


def get_collection():
    settings = get_settings()
    return _get_collection(settings.chroma_persist_path, settings.embedding_model)


def clear_chroma_client_cache() -> None:
    _get_collection.cache_clear()
    _get_client.cache_clear()
