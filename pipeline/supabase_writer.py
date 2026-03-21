"""Write embeddings and metadata to Supabase pgvector tables."""

from __future__ import annotations

import logging

from supabase import create_client, Client

import config

logger = logging.getLogger(__name__)

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    return _client


def upsert_chunks(
    doc_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
    metadata: dict,
) -> None:
    """Upsert chunk embeddings for a single document in batches."""
    client = _get_client()

    rows = []
    for i, (chunk_text, emb) in enumerate(zip(chunks, embeddings)):
        rows.append({
            "id": f"{doc_id}_chunk_{i}",
            "doc_id": doc_id,
            "ref": metadata.get("ref", ""),
            "date": metadata.get("date", ""),
            "title": metadata.get("title", ""),
            "source_url": metadata.get("source_url", ""),
            "chunk_index": i,
            "content": chunk_text,
            "embedding": emb,
        })

    # Batch into groups of 50 for safety
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        try:
            res = client.table("chunks").upsert(batch).execute()
            # If execute returns a response object with 'data' and 'error', check it
            if hasattr(res, 'error') and res.error:
                logger.error("Error upserting chunk batch %d: %s", i // batch_size, res.error)
        except Exception as e:
            logger.error("Exception during chunk batch %d upsert: %s", i // batch_size, e)
            
    logger.info("Upserted %d chunks for doc_id=%s", len(chunks), doc_id)


def upsert_summary(
    doc_id: str,
    summary: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    """Upsert the summary embedding for a single document."""
    client = _get_client()

    row = {
        "id": f"{doc_id}_summary",
        "doc_id": doc_id,
        "ref": metadata.get("ref", ""),
        "date": metadata.get("date", ""),
        "title": metadata.get("title", ""),
        "source_url": metadata.get("source_url", ""),
        "summary_text": summary,
        "embedding": embedding,
    }

    client.table("summaries").upsert(row).execute()
    logger.info("Upserted summary for doc_id=%s", doc_id)


def upsert_title(
    doc_id: str,
    title: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    """Upsert the title embedding for a single document."""
    client = _get_client()

    row = {
        "id": f"{doc_id}_title",
        "doc_id": doc_id,
        "ref": metadata.get("ref", ""),
        "date": metadata.get("date", ""),
        "title": metadata.get("title", ""),
        "source_url": metadata.get("source_url", ""),
        "embedding": embedding,
    }

    client.table("titles").upsert(row).execute()
    logger.info("Upserted title for doc_id=%s", doc_id)
