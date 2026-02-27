"""Write embeddings and metadata to ChromaDB collections."""

from __future__ import annotations

import logging

import chromadb

import config

logger = logging.getLogger(__name__)

_chroma_client: chromadb.PersistentClient | None = None


def _get_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        config.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=str(config.CHROMA_DIR))
    return _chroma_client


def _get_collection(name: str) -> chromadb.Collection:
    client = _get_client()
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


def upsert_chunks(
    doc_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
    metadata: dict,
) -> None:
    """Upsert chunk embeddings for a single document."""
    collection = _get_collection(config.CHROMA_COLLECTION_CHUNKS)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = []
    for i, chunk_text in enumerate(chunks):
        m = {
            "doc_id": doc_id,
            "ref": metadata.get("ref", ""),
            "date": metadata.get("date", ""),
            "title": metadata.get("title", ""),
            "source_url": metadata.get("source_url", ""),
            "chunk_index": i,
            "text": chunk_text[:4000],  # Chroma metadata value size limit
        }
        metadatas.append(m)

    collection.upsert(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=chunks)
    logger.info("Upserted %d chunks for doc_id=%s", len(chunks), doc_id)


def upsert_summary(
    doc_id: str,
    summary: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    """Upsert the summary embedding for a single document."""
    collection = _get_collection(config.CHROMA_COLLECTION_SUMMARIES)
    m = {
        "doc_id": doc_id,
        "ref": metadata.get("ref", ""),
        "date": metadata.get("date", ""),
        "title": metadata.get("title", ""),
        "source_url": metadata.get("source_url", ""),
        "summary_text": summary[:4000],
    }
    collection.upsert(
        ids=[f"{doc_id}_summary"],
        embeddings=[embedding],
        metadatas=[m],
        documents=[summary],
    )
    logger.info("Upserted summary for doc_id=%s", doc_id)


def upsert_title(
    doc_id: str,
    title: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    """Upsert the title embedding for a single document."""
    collection = _get_collection(config.CHROMA_COLLECTION_TITLES)
    m = {
        "doc_id": doc_id,
        "ref": metadata.get("ref", ""),
        "date": metadata.get("date", ""),
        "title": metadata.get("title", ""),
        "source_url": metadata.get("source_url", ""),
    }
    collection.upsert(
        ids=[f"{doc_id}_title"],
        embeddings=[embedding],
        metadatas=[m],
        documents=[title],
    )
    logger.info("Upserted title for doc_id=%s", doc_id)
