"""
Migrate all data from local ChromaDB to Supabase pgvector.

Usage:
    python migrate_to_supabase.py

Prerequisites:
    1. Run supabase_schema.sql in your Supabase SQL Editor first.
    2. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
"""

from __future__ import annotations

import logging
import sys
import time

import chromadb
from supabase import create_client, Client

import config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

FETCH_BATCH = 10
UPLOAD_BATCH = 30


def get_supabase() -> Client:
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        sys.exit(1)
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


def get_chroma() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=str(config.CHROMA_DIR))


def _to_list(emb) -> list[float]:
    if hasattr(emb, "tolist"):
        return emb.tolist()
    return list(emb)


def _clean(text: str) -> str:
    """Remove null bytes and other characters PostgreSQL can't handle."""
    if not text:
        return ""
    return text.replace("\x00", "")


def _get_all_ids(col: chromadb.Collection) -> list[str]:
    result = col.get(include=[])
    return result["ids"]


def _safe_get(col: chromadb.Collection, ids: list[str]) -> dict | None:
    """Fetch a batch of IDs; if the batch fails, try one-by-one."""
    try:
        return col.get(ids=ids, include=["metadatas", "documents", "embeddings"])
    except Exception:
        results = {"ids": [], "metadatas": [], "documents": [], "embeddings": []}
        for single_id in ids:
            try:
                r = col.get(ids=[single_id], include=["metadatas", "documents", "embeddings"])
                results["ids"].extend(r["ids"])
                if r["metadatas"] is not None:
                    results["metadatas"].extend(r["metadatas"])
                if r["documents"] is not None:
                    results["documents"].extend(r["documents"])
                if r["embeddings"] is not None:
                    results["embeddings"].extend(list(r["embeddings"]))
            except Exception:
                logger.warning("  Skipping corrupted id: %s", single_id)
        return results if results["ids"] else None


def _upload_rows(sb: Client, table: str, rows: list[dict]) -> None:
    for i in range(0, len(rows), UPLOAD_BATCH):
        batch = rows[i : i + UPLOAD_BATCH]
        sb.table(table).upsert(batch).execute()
        time.sleep(0.05)


def migrate_chunks(chroma: chromadb.PersistentClient, sb: Client) -> int:
    try:
        col = chroma.get_collection(config.CHROMA_COLLECTION_CHUNKS)
    except Exception:
        logger.warning("No chunks collection found in ChromaDB, skipping")
        return 0

    all_ids = _get_all_ids(col)
    count = len(all_ids)
    logger.info("Migrating %d chunks...", count)

    rows = []
    skipped = 0
    for i in range(0, count, FETCH_BATCH):
        batch_ids = all_ids[i : i + FETCH_BATCH]
        batch = _safe_get(col, batch_ids)
        if batch is None:
            skipped += len(batch_ids)
            continue

        for j, id_ in enumerate(batch["ids"]):
            meta = batch["metadatas"][j] if j < len(batch.get("metadatas", [])) else {}
            doc = batch["documents"][j] if j < len(batch.get("documents", [])) else ""
            emb = batch["embeddings"][j] if j < len(batch.get("embeddings", [])) else []

            rows.append({
                "id": id_,
                "doc_id": _clean(meta.get("doc_id", "") if isinstance(meta, dict) else ""),
                "ref": _clean(meta.get("ref", "") if isinstance(meta, dict) else ""),
                "date": _clean(meta.get("date", "") if isinstance(meta, dict) else ""),
                "title": _clean(meta.get("title", "") if isinstance(meta, dict) else ""),
                "source_url": _clean(meta.get("source_url", "") if isinstance(meta, dict) else ""),
                "chunk_index": meta.get("chunk_index", 0) if isinstance(meta, dict) else 0,
                "content": _clean(doc or ""),
                "embedding": _to_list(emb),
            })

        if len(rows) >= UPLOAD_BATCH:
            _upload_rows(sb, "chunks", rows)
            logger.info("  chunks: %d / %d (skipped: %d)", i + len(batch_ids), count, skipped)
            rows = []

    if rows:
        _upload_rows(sb, "chunks", rows)

    migrated = count - skipped
    logger.info("  chunks done: %d migrated, %d skipped", migrated, skipped)
    return migrated


def migrate_summaries(chroma: chromadb.PersistentClient, sb: Client) -> int:
    try:
        col = chroma.get_collection(config.CHROMA_COLLECTION_SUMMARIES)
    except Exception:
        logger.warning("No summaries collection found in ChromaDB, skipping")
        return 0

    all_ids = _get_all_ids(col)
    count = len(all_ids)
    logger.info("Migrating %d summaries...", count)

    rows = []
    skipped = 0
    for i in range(0, count, FETCH_BATCH):
        batch_ids = all_ids[i : i + FETCH_BATCH]
        batch = _safe_get(col, batch_ids)
        if batch is None:
            skipped += len(batch_ids)
            continue

        for j, id_ in enumerate(batch["ids"]):
            meta = batch["metadatas"][j] if j < len(batch.get("metadatas", [])) else {}
            doc = batch["documents"][j] if j < len(batch.get("documents", [])) else ""
            emb = batch["embeddings"][j] if j < len(batch.get("embeddings", [])) else []

            rows.append({
                "id": id_,
                "doc_id": _clean(meta.get("doc_id", "") if isinstance(meta, dict) else ""),
                "ref": _clean(meta.get("ref", "") if isinstance(meta, dict) else ""),
                "date": _clean(meta.get("date", "") if isinstance(meta, dict) else ""),
                "title": _clean(meta.get("title", "") if isinstance(meta, dict) else ""),
                "source_url": _clean(meta.get("source_url", "") if isinstance(meta, dict) else ""),
                "summary_text": _clean(meta.get("summary_text", doc) if isinstance(meta, dict) else doc),
                "embedding": _to_list(emb),
            })

        if len(rows) >= UPLOAD_BATCH:
            _upload_rows(sb, "summaries", rows)
            logger.info("  summaries: %d / %d (skipped: %d)", i + len(batch_ids), count, skipped)
            rows = []

    if rows:
        _upload_rows(sb, "summaries", rows)

    migrated = count - skipped
    logger.info("  summaries done: %d migrated, %d skipped", migrated, skipped)
    return migrated


def migrate_titles(chroma: chromadb.PersistentClient, sb: Client) -> int:
    try:
        col = chroma.get_collection(config.CHROMA_COLLECTION_TITLES)
    except Exception:
        logger.warning("No titles collection found in ChromaDB, skipping")
        return 0

    all_ids = _get_all_ids(col)
    count = len(all_ids)
    logger.info("Migrating %d titles...", count)

    rows = []
    skipped = 0
    for i in range(0, count, FETCH_BATCH):
        batch_ids = all_ids[i : i + FETCH_BATCH]
        batch = _safe_get(col, batch_ids)
        if batch is None:
            skipped += len(batch_ids)
            continue

        for j, id_ in enumerate(batch["ids"]):
            meta = batch["metadatas"][j] if j < len(batch.get("metadatas", [])) else {}
            emb = batch["embeddings"][j] if j < len(batch.get("embeddings", [])) else []

            rows.append({
                "id": id_,
                "doc_id": _clean(meta.get("doc_id", "") if isinstance(meta, dict) else ""),
                "ref": _clean(meta.get("ref", "") if isinstance(meta, dict) else ""),
                "date": _clean(meta.get("date", "") if isinstance(meta, dict) else ""),
                "title": _clean(meta.get("title", "") if isinstance(meta, dict) else ""),
                "source_url": _clean(meta.get("source_url", "") if isinstance(meta, dict) else ""),
                "embedding": _to_list(emb),
            })

        if len(rows) >= UPLOAD_BATCH:
            _upload_rows(sb, "titles", rows)
            logger.info("  titles: %d / %d (skipped: %d)", i + len(batch_ids), count, skipped)
            rows = []

    if rows:
        _upload_rows(sb, "titles", rows)

    migrated = count - skipped
    logger.info("  titles done: %d migrated, %d skipped", migrated, skipped)
    return migrated


def main():
    logger.info("=" * 60)
    logger.info("ChromaDB -> Supabase migration")
    logger.info("=" * 60)

    chroma = get_chroma()
    sb = get_supabase()

    t0 = time.time()

    n_chunks = migrate_chunks(chroma, sb)
    n_summaries = migrate_summaries(chroma, sb)
    n_titles = migrate_titles(chroma, sb)

    elapsed = time.time() - t0
    logger.info("=" * 60)
    logger.info("Migration complete in %.1fs", elapsed)
    logger.info("  Chunks: %d", n_chunks)
    logger.info("  Summaries: %d", n_summaries)
    logger.info("  Titles: %d", n_titles)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
