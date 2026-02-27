"""Embed text using Gemini embedding model with concurrent batching."""

from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from google import genai
from google.genai import types

import config

logger = logging.getLogger(__name__)

_client_local = threading.local()


def _get_client() -> genai.Client:
    if not hasattr(_client_local, "client"):
        _client_local.client = genai.Client(
            api_key=config.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=120_000),
        )
    return _client_local.client


def _embed_batch(batch: list[str], batch_idx: int) -> tuple[int, list[list[float]]]:
    """Embed a single batch with retry logic. Returns (batch_idx, embeddings)."""
    client = _get_client()
    for attempt in range(config.LLM_MAX_RETRIES + 1):
        try:
            result = client.models.embed_content(
                model=config.EMBEDDING_MODEL,
                contents=batch,
                config={"output_dimensionality": config.EMBEDDING_DIMENSIONS},
            )
            return batch_idx, [e.values for e in result.embeddings]
        except Exception as exc:
            if attempt == config.LLM_MAX_RETRIES:
                logger.error("Embedding batch %d failed after retries: %s", batch_idx, exc)
                raise
            wait = config.LLM_RETRY_DELAY * (2 ** attempt)
            logger.warning("Embedding batch %d retry %d in %.1fs: %s", batch_idx, attempt + 1, wait, exc)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts using concurrent batch requests.
    Returns embedding vectors in the same order as input texts.
    """
    if not texts:
        return []

    batch_size = config.EMBEDDING_BATCH_SIZE
    batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]

    if len(batches) == 1:
        _, embeddings = _embed_batch(batches[0], 0)
        return embeddings

    results: dict[int, list[list[float]]] = {}
    max_concurrent = max(1, config.EMBEDDING_RATE_LIMIT_RPM // 10)

    with ThreadPoolExecutor(max_workers=min(max_concurrent, len(batches))) as pool:
        futures = {
            pool.submit(_embed_batch, batch, idx): idx
            for idx, batch in enumerate(batches)
        }
        for future in as_completed(futures):
            idx, embeddings = future.result()
            results[idx] = embeddings

    ordered: list[list[float]] = []
    for idx in range(len(batches)):
        ordered.extend(results[idx])
    return ordered


def embed_single(text: str) -> list[float]:
    """Embed a single text string."""
    _, embeddings = _embed_batch([text], 0)
    return embeddings[0]
