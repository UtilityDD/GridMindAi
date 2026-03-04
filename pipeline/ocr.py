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


def _load_ocr_prompt() -> str:
    return (config.PROMPTS_DIR / "ocr.txt").read_text(encoding="utf-8").strip()


OCR_PROMPT = _load_ocr_prompt()


def ocr_page_gemini(page_image: Image.Image) -> str:
    """Send a page image to Gemini vision with pool-based key rotation on 429 errors."""
    import time
    max_retries = len(config.GEMINI_KEY_POOL) * 2
    
    for attempt in range(max_retries):
        client = _get_client() # Naturally rotates on each call/retry
        try:
            response = client.models.generate_content(
                model=config.GEMINI_VISION_MODEL,
                contents=[OCR_PROMPT, page_image],
            )
            text = response.text or ""
            if text.strip():
                return text
            
            # If empty text but no exception, wait a bit and retry
            if attempt < 2:
                time.sleep(2)
                continue
        except Exception as exc:
            msg = str(exc)
            is_rate_limit = "429" in msg or "RESOURCE_EXHAUSTED" in msg
            
            if is_rate_limit:
                logger.warning("Gemini OCR hit rate limit. Rotating key... (Attempt %d/%d)", attempt + 1, max_retries)
                time.sleep(1) # Short wait before trying next key
                continue
            
            # For other errors, use exponential backoff
            wait = (attempt + 1) * 5.0
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
