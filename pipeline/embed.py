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
_request_lock = threading.Lock()
_last_request_time = 0.0

def _get_client(key=None) -> genai.Client:
    """Gets a client for a specific key or the next one in the pool."""
    global _pool_index
    if key is None:
        # PRIORITIZE PAID KEY IF AVAILABLE
        if config.GEMINI_PAID_KEY:
            key = config.GEMINI_PAID_KEY
        else:
            key = config.GEMINI_KEY_POOL[_pool_index % len(config.GEMINI_KEY_POOL)]
            _pool_index += 1
        
    return genai.Client(
        api_key=key,
        http_options=types.HttpOptions(timeout=120_000),
    )


def _embed_batch(batch: list[str], batch_idx: int) -> tuple[int, list[list[float]]]:
    """Embed a single batch with key rotation on 429 errors."""
    max_retries = 100  # Extreme resilience for TPM limits
    
    for attempt in range(max_retries):
        client = _get_client() # Rotates on each retry
        try:
            result = client.models.embed_content(
                model=config.EMBEDDING_MODEL,
                contents=batch,
                config={"output_dimensionality": config.EMBEDDING_DIMENSIONS},
            )
            # Rule: 0.7-1.0 sec delay after every embedding call
            wait_time = 1.0 
            logger.info("Batch embedding successful. Waiting %.1fs (Sequential Guard)...", wait_time)
            time.sleep(wait_time)
            return batch_idx, [e.values for e in result.embeddings]
        except Exception as exc:
            msg = str(exc)
            
            # Rotate key on rate limit OR invalid/expired key errors
            is_key_error = (
                "429" in msg or 
                "RESOURCE_EXHAUSTED" in msg or 
                "400" in msg or 
                "403" in msg or
                "INVALID_ARGUMENT" in msg or
                "API key expired" in msg or
                "authorized" in msg.lower() or
                "leaked" in msg.lower()
            )
            
            if is_key_error and attempt < max_retries - 1:
                # Rule: Retry with exponential backoff (2s, 4s, 8s…)
                # After several misses, increase delay dynamically to 60s
                wait = min(60, (2 ** (attempt + 1))) 
                logger.warning("Embedding batch %d hit error. Rotating key and backing off %.1fs... (Error: %s)", batch_idx, wait, msg[:100])
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
    global _last_request_time
    if not texts:
        return []

    batch_size = config.EMBEDDING_BATCH_SIZE
    batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]

    if len(batches) == 1:
        _, embeddings = _embed_batch(batches[0], 0)
        return embeddings

    results: list[list[float]] = []
    chunk_counter = 0

    for idx, batch in enumerate(batches):
        # EXTREME STAGGER TO AVOID PROJECT-WIDE TPM/RPM LIMITS
        with _request_lock:
            now = time.time()
            # Rule: Increase to 10.0s global gap to stay under the 15 RPM project limit
            since_last = now - _last_request_time
            sleep_needed = 10.0 - since_last
            if sleep_needed > 0:
                time.sleep(sleep_needed)
            _last_request_time = time.time()

        # Rule: After every 20 chunks -> pause 3-5 sec
        if chunk_counter > 0 and chunk_counter % 20 == 0:
            logger.info("Soft pause: 5s after 20 chunks to prevent TPM spike...")
            time.sleep(5.0)

        _, batch_embeddings = _embed_batch(batch, idx)
        results.extend(batch_embeddings)
        chunk_counter += len(batch)

    return results


def embed_single(text: str) -> list[float]:
    """Embed a single text string."""
    _, embeddings = _embed_batch([text], 0)
    return embeddings[0]
