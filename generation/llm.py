"""Call Gemini (primary), Groq, or OpenAI (fallback) to generate the final answer."""

from __future__ import annotations

import logging
import time

from google import genai

import config
from generation.prompt import SYSTEM_PROMPT, build_user_prompt

logger = logging.getLogger(__name__)

GROQ_MODELS = {
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "moonshotai/kimi-k2-instruct",
    "moonshotai/kimi-k2-instruct-0905",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3-32b",
}

_gemini_client: genai.Client | None = None
_groq_client = None


def _get_gemini_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _gemini_client


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        _groq_client = Groq(api_key=config.GROQ_API_KEY)
    return _groq_client


def _call_gemini(question: str, context: str, sources: list[dict], verbosity: int = 3) -> str:
    client = _get_gemini_client()
    user_prompt = build_user_prompt(question, context, sources, verbosity=verbosity)

    response = client.models.generate_content(
        model=config.GEMINI_LLM_MODEL,
        contents=user_prompt,
        config={"system_instruction": SYSTEM_PROMPT},
    )
    return response.text or ""


def _call_groq(question: str, context: str, sources: list[dict], model: str, verbosity: int = 3) -> str:
    client = _get_groq_client()
    user_prompt = build_user_prompt(question, context, sources, verbosity=verbosity)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content or ""


def _call_openai(question: str, context: str, sources: list[dict], verbosity: int = 3) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=config.OPENAI_API_KEY)
    user_prompt = build_user_prompt(question, context, sources, verbosity=verbosity)

    response = client.chat.completions.create(
        model=config.OPENAI_LLM_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content or ""


def generate_answer(
    question: str,
    context: str,
    sources: list[dict],
    verbosity: int = 3,
    model: str | None = None,
) -> dict:
    """
    Generate an answer using the specified model (or Gemini by default with OpenAI fallback).

    *model* can be:
      - None / "gemini-2.5-flash" → Gemini
      - Any key in GROQ_MODELS → Groq
      - Anything else → treated as Gemini default
    """
    if model and model in GROQ_MODELS:
        if not config.GROQ_API_KEY:
            return {
                "answer": "Groq API key is not configured.",
                "sources": sources,
                "model_used": "none",
            }
        try:
            answer = _call_groq(question, context, sources, model, verbosity=verbosity)
            return {"answer": answer, "sources": sources, "model_used": model}
        except Exception as exc:
            logger.exception("Groq model %s failed: %s", model, exc)
            return {
                "answer": f"Model {model} failed to generate an answer. Please try another model.",
                "sources": sources,
                "model_used": "none",
            }

    # Default: Gemini with OpenAI fallback
    for attempt in range(config.LLM_MAX_RETRIES):
        try:
            answer = _call_gemini(question, context, sources, verbosity=verbosity)
            return {"answer": answer, "sources": sources, "model_used": config.GEMINI_LLM_MODEL}
        except Exception as exc:
            logger.warning("Gemini attempt %d failed: %s", attempt + 1, exc)
            time.sleep(config.LLM_RETRY_DELAY * (2 ** attempt))

    if config.OPENAI_API_KEY:
        logger.info("Falling back to OpenAI")
        try:
            answer = _call_openai(question, context, sources, verbosity=verbosity)
            return {"answer": answer, "sources": sources, "model_used": config.OPENAI_LLM_MODEL}
        except Exception:
            logger.exception("OpenAI fallback also failed")

    return {
        "answer": "Sorry, I was unable to generate an answer at this time. Please try again later.",
        "sources": sources,
        "model_used": "none",
    }
