"""Extract text from a PDF file: native text first, then OCR for image pages."""

from __future__ import annotations

import logging
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

from pipeline.ocr import ocr_page
import config

logger = logging.getLogger(__name__)


def extract_text(pdf_path: Path, use_gemini_ocr: bool | None = None) -> str:
    """
    Extract text from *pdf_path*.
    For each page: try native text extraction; if the result is too short,
    render the page as an image and OCR it.
    Returns concatenated text for the entire PDF.
    """
    doc = fitz.open(str(pdf_path))
    pages_text: list[str] = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text") or ""

        if len(text.strip()) < config.OCR_MIN_TEXT_LENGTH:
            logger.info(
                "Page %d of %s has only %d chars, running OCR",
                page_num + 1,
                pdf_path.name,
                len(text.strip()),
            )
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = ocr_page(img, use_gemini=use_gemini_ocr)

        pages_text.append(text)

    doc.close()
    return "\n\n".join(pages_text)
