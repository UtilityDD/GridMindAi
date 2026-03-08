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


_pool_index = 0

def _get_client(key=None) -> genai.Client:
    """Gets a client for a specific key or the next one in the pool."""
    global _pool_index
    if key is None:
        key = config.GEMINI_KEY_POOL[_pool_index % len(config.GEMINI_KEY_POOL)]
        _pool_index += 1
        
    return genai.Client(
        api_key=key,
        http_options=types.HttpOptions(timeout=120_000),
    )


def _embed_batch(batch: list[str], batch_idx: int) -> tuple[int, list[list[float]]]:
    """Embed a single batch with key rotation on 429 errors."""
    max_retries = 30
    
    for attempt in range(max_retries):
        client = _get_client() # Rotates on each retry
        try:
            result = client.models.embed_content(
                model=config.EMBEDDING_MODEL,
                contents=batch,
                config={"output_dimensionality": config.EMBEDDING_DIMENSIONS},
            )
            # Efficient delay between batches to respect TPM/RPM limits across multiple keys
            logger.info("Batch embedding successful. Waiting 10s...")
            time.sleep(10)
            return batch_idx, [e.values for e in result.embeddings]
        except Exception as exc:
            msg = str(exc)
            
            # Rotate key on rate limit OR invalid/expired key errors
            is_key_error = (
                "429" in msg or 
                "RESOURCE_EXHAUSTED" in msg or 
                "400" in msg or 
                "INVALID_ARGUMENT" in msg or
                "API key expired" in msg or
                "authorized" in msg.lower()
            )
            
            if is_key_error and attempt < max_retries - 1:
                # Exponential backoff for 429
                wait = min(60, (2 ** attempt) + 5) 
                logger.warning("Embedding batch %d hit error. Rotating key and waiting %.1fs... (Error: %s)", batch_idx, wait, msg[:100])
                time.sleep(wait)
                continue
                
            if attempt == max_retries - 1:
                logger.error("Embedding batch %d failed after %d attempts: %s", batch_idx, max_retries, exc)
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
    # Moderate concurrency across our multiple available keys (8 keys = 21 RPM max)
    max_concurrent = 2 

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
