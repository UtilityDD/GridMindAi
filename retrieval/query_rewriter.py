"""Rewrite user queries into optimized search queries using an LLM."""

from __future__ import annotations

import logging

from google import genai

import config

logger = logging.getLogger(__name__)

_client: genai.Client | None = None

_TEMPLATE: str | None = None


def _load_template() -> str:
    global _TEMPLATE
    if _TEMPLATE is None:
        _TEMPLATE = (config.PROMPTS_DIR / "rewrite_query.txt").read_text(encoding="utf-8").strip()
    return _TEMPLATE


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


def rewrite_query(question: str) -> str:
    """
    Rewrite a user question into an optimized search query.
    Falls back to the original question on any failure.
    """
    template = _load_template()
    prompt = template.format(question=question)

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=config.GEMINI_LLM_MODEL,
            contents=prompt,
        )
        rewritten = (response.text or "").strip()
        if rewritten:
            logger.info("Query rewritten: '%s' → '%s'", question, rewritten)
            return rewritten
    except Exception:
        logger.warning("Query rewrite failed, using original question")

    return question
