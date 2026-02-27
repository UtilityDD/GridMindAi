"""Build the final context string for the LLM from three-way Supabase retrieval results."""

from __future__ import annotations

import config


def build_context(retrieval_result: dict) -> tuple[str, list[dict]]:
    """
    Given the output of three_way.retrieve(), build:
      1. A context string to inject into the LLM prompt.
      2. A list of source-document metadata dicts for citation.

    Returns (context_text, sources).
    """
    doc_ids = retrieval_result["doc_ids"]
    chunk_results: list[dict] = retrieval_result["chunk_results"]
    summary_results: list[dict] = retrieval_result["summary_results"]

    summary_by_doc: dict[str, str] = {}
    for row in summary_results:
        did = row.get("doc_id", "")
        summary_by_doc[did] = row.get("summary_text", "")

    chunks_by_doc: dict[str, list[dict]] = {}
    for row in chunk_results:
        did = row.get("doc_id", "")
        if did not in chunks_by_doc:
            chunks_by_doc[did] = []
        if len(chunks_by_doc[did]) < config.MAX_CONTEXT_CHUNKS_PER_DOC:
            chunks_by_doc[did].append({
                "text": row.get("content", ""),
                "chunk_index": row.get("chunk_index", 0),
            })

    context_parts: list[str] = []
    sources: list[dict] = []

    for did in doc_ids:
        meta = _find_meta(did, retrieval_result)
        if not meta:
            continue

        ref = meta.get("ref", "unknown")
        date = meta.get("date", "")
        title = meta.get("title", "")
        url = meta.get("source_url", "")

        header = f"--- Document: {ref} | Date: {date} | Title: {title} ---"
        parts = [header]

        summary = summary_by_doc.get(did, "")
        if summary:
            parts.append(f"[Summary] {summary}")

        doc_chunks = chunks_by_doc.get(did, [])
        for chunk in sorted(doc_chunks, key=lambda c: c["chunk_index"]):
            parts.append(chunk["text"])

        context_parts.append("\n".join(parts))
        sources.append({
            "doc_id": did,
            "ref": ref,
            "date": date,
            "title": title,
            "source_url": url,
        })

    context_text = "\n\n".join(context_parts)
    return context_text, sources


def _find_meta(doc_id: str, retrieval_result: dict) -> dict | None:
    """Find the first metadata dict for *doc_id* across all result sets."""
    for key in ("chunk_results", "summary_results", "title_results"):
        result_list: list[dict] = retrieval_result.get(key, [])
        for row in result_list:
            if row.get("doc_id") == doc_id:
                return row
    return None
