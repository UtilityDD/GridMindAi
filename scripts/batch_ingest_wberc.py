#!/usr/bin/env python3
"""Batch ingest WBERC regulations into the RAG system using wberc_data.json."""

import json
import logging
import sys
import time
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import config and pipeline
import config
from scraper.download import download_pdfs
from pipeline.run import run_pipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("batch_ingest")

# Data path
DATA_PATH = PROJECT_ROOT / "wberc_data.json"

def main():
    if not DATA_PATH.exists():
        logger.error(f"Data file not found at {DATA_PATH}. Please run the metadata extraction first.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        wberc_data = json.load(f)

    logger.info(f"Starting batch ingestion for {len(wberc_data)} regulations...")

    # Ensure sequential processing
    config.PIPELINE_WORKERS = 1
    logger.info("Enforced PIPELINE_WORKERS=1 for sequential processing.")

    for i, reg in enumerate(wberc_data):
        logger.info(f"\n{'='*20}")
        logger.info(f"Regulation {i+1}/{len(wberc_data)}: {reg['title']}")
        logger.info(f"{'='*20}")
        
        # Flatten PDFs for download
        pdfs_to_download = []
        for p in reg["pdfs"]:
            pdfs_to_download.append({
                "pdf_url": p["url"],
                "ref": reg["ref"],
                "date": reg["date"],
                "title": f"{reg['title']} [{p['type']}]",
            })

        # 1. Download PDFs
        logger.info(f"Phase 1: Downloading {len(pdfs_to_download)} PDFs...")
        new_count = download_pdfs(pdfs_to_download)
        logger.info(f"Downloaded {new_count} new PDFs.")
        
        # 2. Run Pipeline
        logger.info("Phase 2: Running Ingestion Pipeline...")
        # run_pipeline processes everything currently in manifest.json
        result = run_pipeline()
        
        logger.info(f"Result for {reg['title']}: {result}")
        
        # Delay between regulations to avoid API pressure
        if i < len(wberc_data) - 1:
            wait_time = 30
            logger.info(f"Waiting {wait_time} seconds before next regulation...")
            time.sleep(wait_time)

    logger.info("Full batch ingestion process completed.")

if __name__ == "__main__":
    main()
