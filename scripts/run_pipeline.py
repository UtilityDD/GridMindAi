#!/usr/bin/env python3
"""Convenience script: run the ingestion pipeline on adding_new_files/."""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.run import run_pipeline

import argparse
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the WBSEDCL RAG ingestion pipeline")
    parser.add_argument(
        "--ocr",
        choices=["gemini", "tesseract", "auto"],
        default="auto",
        help="OCR method for image-based PDFs (default: auto, uses config.OCR_USE_GEMINI)",
    )
    args = parser.parse_args()

    use_gemini = None
    if args.ocr == "gemini":
        use_gemini = True
    elif args.ocr == "tesseract":
        use_gemini = False

    result = run_pipeline(use_gemini_ocr=use_gemini)
    print(f"\nPipeline complete:")
    print(f"  Total:   {result['total']}")
    print(f"  Success: {result['success']}")
    print(f"  Failed:  {result['failed']}")
    if result.get("failed_files"):
        print(f"  Failed files: {result['failed_files']}")


if __name__ == "__main__":
    main()
