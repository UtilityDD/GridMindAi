"""Orchestrate the full ingestion pipeline with parallel document processing."""

from __future__ import annotations

import hashlib
import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import config
from pipeline.extract import extract_text
from pipeline.chunk import chunk_text
from pipeline.summarize import summarize_document
from pipeline.embed import embed_texts, embed_single
from pipeline.supabase_writer import upsert_chunks, upsert_summary, upsert_title
from pipeline.move_processed import move_file, update_manifests

logger = logging.getLogger(__name__)

_manifest_lock = threading.Lock()


def _make_doc_id(entry: dict) -> str:
    raw = f"{entry.get('ref', '')}|{entry.get('date', '')}|{entry.get('source_url', '')}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _load_manifest() -> list[dict]:
    if not config.MANIFEST_PATH.exists():
        return []
    with open(config.MANIFEST_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def process_entry(entry: dict, use_gemini_ocr: bool | None = None) -> bool:
    """
    Process a single manifest entry through the full pipeline.
    Returns True on success, False on failure.
    """
    filename = entry["filename"]
    pdf_path = config.ADDING_NEW_FILES_DIR / filename

    if not pdf_path.exists():
        logger.error("PDF not found: %s", pdf_path)
        return False

    doc_id = _make_doc_id(entry)
    metadata = {
        "ref": entry.get("ref", ""),
        "date": entry.get("date", ""),
        "title": entry.get("title", ""),
        "source_url": entry.get("source_url", ""),
    }

    logger.info("Processing [%s] %s – %s", doc_id, entry.get("ref"), entry.get("title", "")[:60])

    # 1. Extract text (CPU-bound + possible OCR API calls)
    try:
        text = extract_text(pdf_path, use_gemini_ocr=use_gemini_ocr)
    except Exception:
        logger.exception("Text extraction failed for %s", filename)
        return False

    if not text.strip():
        logger.warning("No text extracted from %s, skipping", filename)
        return False

    # 2. Chunk (CPU-bound, fast)
    chunks = chunk_text(text)
    if not chunks:
        logger.warning("No chunks produced for %s", filename)
        return False

    # 3. Summarize (API call) - DISABLED as per user request
    summary = None
    # summary = summarize_document(text, ref=entry.get("ref", ""), date=entry.get("date", ""))

    # 4. Build title string
    title_text = entry.get("title", "")
    keywords = entry.get("keywords", "")
    if keywords:
        title_text = f"{title_text} | Keywords: {keywords}"

    # 5. Embed chunks (batched API calls)
    try:
        chunk_embeddings = embed_texts(chunks)
    except Exception:
        logger.exception("Chunk embedding failed for %s", filename)
        return False

    # Embed summary and title (small, fast)
    summary_embedding = None
    if summary:
        try:
            summary_embedding = embed_single(summary)
        except Exception:
            logger.exception("Summary embedding failed for %s", filename)

    title_embedding = None
    if title_text:
        try:
            title_embedding = embed_single(title_text)
        except Exception:
            logger.exception("Title embedding failed for %s", filename)

    # 6. Write to ChromaDB (thread-safe via Chroma's internal locking)
    upsert_chunks(doc_id, chunks, chunk_embeddings, metadata)

    if summary_embedding and summary:
        upsert_summary(doc_id, summary, summary_embedding, metadata)

    if title_embedding and title_text:
        upsert_title(doc_id, title_text, title_embedding, metadata)

    # 7. Move file and update manifests (serialized via lock)
    with _manifest_lock:
        move_file(filename)
        update_manifests(entry)

    logger.info("Successfully processed %s", filename)
    return True


def run_pipeline(use_gemini_ocr: bool | None = None) -> dict:
    """
    Process all entries in adding_new_files/manifest.json using a thread pool.
    Returns a summary dict with counts.
    """
    manifest = _load_manifest()
    if not manifest:
        logger.info("No entries in manifest – nothing to process")
        return {"total": 0, "success": 0, "failed": 0}

    total = len(manifest)
    success = 0
    failed = 0
    failed_files: list[str] = []

    workers = config.PIPELINE_WORKERS
    logger.info("Starting pipeline for %d files with %d workers", total, workers)

    entries = list(manifest)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        future_to_entry = {
            pool.submit(process_entry, entry, use_gemini_ocr): entry
            for entry in entries
        }
        for future in as_completed(future_to_entry):
            entry = future_to_entry[future]
            try:
                ok = future.result()
                if ok:
                    success += 1
                else:
                    failed += 1
                    failed_files.append(entry.get("filename", "unknown"))
            except Exception:
                logger.exception("Unhandled error processing %s", entry.get("filename"))
                failed += 1
                failed_files.append(entry.get("filename", "unknown"))

            if (success + failed) % 10 == 0:
                logger.info("Progress: %d/%d done (%d ok, %d failed)", success + failed, total, success, failed)

    result = {
        "total": total,
        "success": success,
        "failed": failed,
        "failed_files": failed_files,
    }
    logger.info("Pipeline complete: %s", result)
    return result
