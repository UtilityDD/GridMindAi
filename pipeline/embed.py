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
_blacklisted_keys = set() # Global blacklist for 403/leaked keys

def _get_client(key=None) -> tuple[genai.Client, str]:
    """Gets a client and its key, prioritizing config.GEMINI_API_KEY."""
    global_keys = [config.GEMINI_API_KEY] if config.GEMINI_API_KEY else []
    full_pool = (global_keys + config.GEMINI_KEY_POOL)
    
    global _pool_index
    if key is None:
        for _ in range(len(full_pool)):
            candidate = full_pool[_pool_index % len(full_pool)]
            _pool_index += 1
            if candidate not in _blacklisted_keys:
                key = candidate
                break
        
        if key is None:
            key = full_pool[0]
        
    client = genai.Client(
        api_key=key,
        http_options=types.HttpOptions(timeout=120_000),
    )
    return client, key


def _embed_batch(batch: list[str], batch_idx: int) -> tuple[int, list[list[float]]]:
    """Embed a single batch with key rotation on 429/403 errors."""
    max_retries = 100 
    
    for attempt in range(max_retries):
        client, current_key = _get_client() 
        
        try:
            result = client.models.embed_content(
                model=config.EMBEDDING_MODEL,
                contents=batch,
                config={"output_dimensionality": config.EMBEDDING_DIMENSIONS},
            )
            wait_time = 1.0 
            time.sleep(wait_time)
            return batch_idx, [e.values for e in result.embeddings]
        except Exception as exc:
            msg = str(exc)
            
            # Identify 403/Leaked keys and blacklist them
            is_leaked = "403" in msg or "leaked" in msg.lower() or "authorized" in msg.lower()
            if is_leaked:
                logger.warning("Key detected as leaked/invalid. Blacklisting and rotating... (Error: %s)", msg[:50])
                _blacklisted_keys.add(current_key)
                time.sleep(2)
                continue

            is_rate_limit = "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower()
            if is_rate_limit and attempt < max_retries - 1:
                wait = min(60, (2 ** (attempt + 1))) 
                logger.warning("Rate limit hit. Rotating key and backing off %.1fs...", wait)
                time.sleep(wait)
                continue
                
            if attempt == max_retries - 1:
                logger.error("Embedding batch %d failed after %d attempts: %s", batch_idx, max_retries, exc)
                raise
            
            wait = config.LLM_RETRY_DELAY * (2 ** attempt)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts using parallel batch requests.
    """
    if not texts:
        return []

    batch_size = config.EMBEDDING_BATCH_SIZE
    batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]

    logger.info("Total batches to process: %d (Batch Size: %d)", len(batches), batch_size)
    
    # Use ThreadPoolExecutor for parallel embedding
    # We use min(len(batches), num_keys * 2) to avoid over-saturating a single key
    num_workers = min(10, len(batches)) 
    
    final_results = [None] * len(batches)
    
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        future_to_batch = {
            executor.submit(_embed_batch, batch, idx): idx 
            for idx, batch in enumerate(batches)
        }
        
        for future in as_completed(future_to_batch):
            idx, batch_embeddings = future.result()
            final_results[idx] = batch_embeddings
            logger.info("Completed Batch %d/%d", idx + 1, len(batches))

    # Flatten results
    results = [emb for batch in final_results for emb in batch]
    logger.info("Finished embedding. Total success: %d/%d chunks", len(results), len(texts))
    return results


def embed_single(text: str) -> list[float]:
    """Embed a single text string."""
    _, embeddings = _embed_batch([text], 0)
    return embeddings[0]
