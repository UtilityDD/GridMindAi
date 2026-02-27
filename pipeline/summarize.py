"""Generate a per-PDF summary for the summaries collection."""

from __future__ import annotations

import logging
import threading

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


def _load_summary_prompt() -> str:
    return (config.PROMPTS_DIR / "summarize.txt").read_text(encoding="utf-8").strip()


SUMMARY_PROMPT = _load_summary_prompt()


def summarize_document(text: str, ref: str = "", date: str = "") -> str:
    """
    Call Gemini to produce a RAG-friendly summary of *text*.
    Truncate input if extremely long (keep first ~8000 words to stay in context).
    """
    words = text.split()
    if len(words) > 8000:
        text = " ".join(words[:8000]) + "\n...[truncated]"

    prompt = SUMMARY_PROMPT.format(text=text)
    client = _get_client()

    try:
        response = client.models.generate_content(
            model=config.GEMINI_LLM_MODEL,
            contents=prompt,
        )
        return response.text or ""
    except Exception:
        logger.exception("Summarization failed for ref=%s date=%s", ref, date)
        return ""
