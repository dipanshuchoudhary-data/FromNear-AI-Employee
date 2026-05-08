"""
Persistent ChromaDB vector store with async-friendly wrappers.
Embeddings generated via the LLM client embed() function.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings
from app.llm import embed

logger = logging.getLogger(__name__)

_client: chromadb.Client | None = None
_collection: Any = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        settings = get_settings()
        _client = chromadb.PersistentClient(
            path=settings.vector_store_path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name="fromnear_memory",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def remember(
    text: str,
    vendor_id: int,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Embed *text* and store it in the vector store tagged with *vendor_id*.
    Never raises — logs and swallows errors.
    """
    try:
        vectors = await embed([text])
        collection = _get_collection()
        doc_id = str(uuid4())
        meta = metadata or {}
        meta["vendor_id"] = str(vendor_id)

        # ChromaDB is sync; run in executor to avoid blocking event loop
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: collection.add(
                ids=[doc_id],
                embeddings=[vectors[0]],
                documents=[text],
                metadatas=[meta],
            ),
        )
        logger.debug("remember() stored doc_id=%s vendor_id=%d", doc_id, vendor_id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("remember() failed: %s", exc)


async def recall(
    query: str,
    vendor_id: Optional[int] = None,
    n_results: int = 5,
) -> List[str]:
    """
    Retrieve the most semantically similar snippets for *query*.
    Optionally filter by vendor_id.
    Returns list of document strings (empty list on error).
    """
    try:
        vectors = await embed([query])
        collection = _get_collection()

        where = {"vendor_id": str(vendor_id)} if vendor_id is not None else None

        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            lambda: collection.query(
                query_embeddings=[vectors[0]],
                n_results=n_results,
                where=where,
                include=["documents"],
            ),
        )
        docs = results.get("documents", [[]])[0]
        return [d for d in docs if d]
    except Exception as exc:  # noqa: BLE001
        logger.warning("recall() failed: %s", exc)
        return []
