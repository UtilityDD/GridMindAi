"""Generate a per-PDF summary for the summaries collection."""

from __future__ import annotations

import logging
import threading

from google import genai
from google.genai import types

import config

logger = logging.getLogger(__name__)

_pool_index = 0

def _get_client(key=None) -> genai.Client:
    """Gets a client for a specific key, exclusively using Paid Key if present."""
    global _pool_index
    
    if config.GEMINI_API_KEY:
        full_pool = [config.GEMINI_API_KEY]
    else:
        full_pool = config.GEMINI_KEY_POOL
        
    if key is None:
        key = full_pool[_pool_index % len(full_pool)]
        _pool_index += 1
        
    return genai.Client(
        api_key=key,
        http_options=types.HttpOptions(timeout=120_000),
    )


def _load_summary_prompt() -> str:
    return (config.PROMPTS_DIR / "summarize.txt").read_text(encoding="utf-8").strip()


SUMMARY_PROMPT = _load_summary_prompt()


def summarize_document(text: str, ref: str = "", date: str = "") -> str:
    """
    Call Gemini to produce a RAG-friendly summary of *text*.
    Uses pool-based key rotation on 429 errors.
    """
    words = text.split()
    if len(words) > 500000:
        text = " ".join(words[:500000]) + "\n...[truncated]"

    prompt = SUMMARY_PROMPT.format(text=text)
    max_retries = len(config.GEMINI_KEY_POOL) * 2

    import time
    for attempt in range(max_retries):
        client = _get_client()
        try:
            response = client.models.generate_content(
                model=config.GEMINI_LLM_MODEL,
                contents=prompt,
            )
            return response.text or ""
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
                logger.warning("Summarization hit error. Rotating key... (Error: %s, Attempt %d/%d)", msg[:100], attempt + 1, max_retries)
                time.sleep(1)
                continue
            
            logger.exception("Summarization failed for ref=%s date=%s after %d attempts", ref, date, attempt + 1)
            break
            
    return ""
