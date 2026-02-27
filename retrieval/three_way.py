"""Three-way retrieval: chunks, summaries, and titles via Supabase pgvector -- merged by doc_id. Searches run in parallel."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor

from supabase import create_client, Client

import config
from pipeline.embed import embed_single

logger = logging.getLogger(__name__)

_sb_client: Client | None = None


def _get_client() -> Client:
    global _sb_client
    if _sb_client is None:
        _sb_client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    return _sb_client


def _query_chunks(query_embedding: list[float], top_k: int) -> list[dict]:
    client = _get_client()
    resp = client.rpc(
        "match_chunks",
        {"query_embedding": query_embedding, "match_count": top_k},
    ).execute()
    return resp.data or []


def _query_summaries(query_embedding: list[float], top_k: int) -> list[dict]:
    client = _get_client()
    resp = client.rpc(
        "match_summaries",
        {"query_embedding": query_embedding, "match_count": top_k},
    ).execute()
    return resp.data or []


def _query_titles(query_embedding: list[float], top_k: int) -> list[dict]:
    client = _get_client()
    resp = client.rpc(
        "match_titles",
        {"query_embedding": query_embedding, "match_count": top_k},
    ).execute()
    return resp.data or []


def retrieve(query: str, rewrite: bool = True) -> dict:
    """
    Run three-way retrieval for *query* with parallel collection searches.
    If *rewrite* is True, the query is first rephrased by an LLM for better search.

    Returns a dict:
      {
        "doc_ids": [unique doc_id list],
        "chunk_results": list[dict],
        "summary_results": list[dict],
        "title_results": list[dict],
        "rewritten_query": str | None,
      }
    """
    rewritten_query = None
    search_query = query

    if rewrite:
        from retrieval.query_rewriter import rewrite_query
        rewritten_query = rewrite_query(query)
        search_query = rewritten_query

    query_embedding = embed_single(search_query)

    with ThreadPoolExecutor(max_workers=3) as pool:
        f_chunks = pool.submit(_query_chunks, query_embedding, config.RETRIEVAL_TOP_K_CHUNKS)
        f_summaries = pool.submit(_query_summaries, query_embedding, config.RETRIEVAL_TOP_K_SUMMARIES)
        f_titles = pool.submit(_query_titles, query_embedding, config.RETRIEVAL_TOP_K_TITLES)

        chunk_results = f_chunks.result()
        summary_results = f_summaries.result()
        title_results = f_titles.result()

    seen: set[str] = set()
    ordered_doc_ids: list[str] = []

    for result_list in (chunk_results, summary_results, title_results):
        for row in result_list:
            did = row.get("doc_id", "")
            if did and did not in seen:
                seen.add(did)
                ordered_doc_ids.append(did)

    return {
        "doc_ids": ordered_doc_ids,
        "chunk_results": chunk_results,
        "summary_results": summary_results,
        "title_results": title_results,
        "rewritten_query": rewritten_query,
    }
