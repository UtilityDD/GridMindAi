"""OCR for image-based PDF pages using Gemini vision (primary) or Tesseract (fallback)."""

from __future__ import annotations

import io
import logging
import threading
from PIL import Image

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


def _load_ocr_prompt() -> str:
    return (config.PROMPTS_DIR / "ocr.txt").read_text(encoding="utf-8").strip()


OCR_PROMPT = _load_ocr_prompt()


def ocr_page_gemini(page_image: Image.Image) -> str:
    """Send a page image to Gemini vision with retry logic."""
    import time
    client = _get_client()
    max_retries = 10
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=config.GEMINI_VISION_MODEL,
                contents=[OCR_PROMPT, page_image],
            )
            text = response.text or ""
            if text.strip():
                return text
            # If empty text but no exception, maybe retry once
            if attempt < 2:
                time.sleep(5)
                continue
        except Exception as exc:
            wait = (attempt + 1) * 10.0  # Linear backoff: 10, 20, 30...
            if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                # Specific handling for rate limits
                wait = 15.0 + (attempt * 10.0) 
            
            if attempt < max_retries - 1:
                logger.warning("Gemini OCR attempt %d failed (%s), retrying in %ds", attempt + 1, exc, wait)
                time.sleep(wait)
            else:
                logger.error("Gemini OCR failed after %d attempts: %s", max_retries, exc)
                raise
    return ""


def ocr_page_tesseract(page_image: Image.Image) -> str:
    """Run Tesseract OCR on a page image. Returns empty string if Tesseract is unavailable."""
    try:
        import pytesseract
        return pytesseract.image_to_string(page_image, lang="eng+ben")
    except FileNotFoundError:
        logger.warning("Tesseract not installed, skipping OCR fallback")
        return ""
    except Exception:
        try:
            import pytesseract
            return pytesseract.image_to_string(page_image, lang="eng")
        except FileNotFoundError:
            logger.warning("Tesseract not installed, skipping OCR fallback")
            return ""
        except Exception:
            logger.warning("Tesseract OCR failed completely")
            return ""


def ocr_page(page_image: Image.Image, use_gemini: bool | None = None) -> str:
    """
    OCR a single page image.
    If use_gemini is None, falls back to config.OCR_USE_GEMINI.
    Tries Gemini first (if enabled), falls back to Tesseract on failure.
    """
    if use_gemini is None:
        use_gemini = config.OCR_USE_GEMINI

    if use_gemini:
        try:
            text = ocr_page_gemini(page_image)
            if text.strip():
                return text
            logger.warning("Gemini vision returned empty text, falling back to Tesseract")
        except Exception:
            logger.warning("Gemini vision OCR failed, falling back to Tesseract")

    return ocr_page_tesseract(page_image)
