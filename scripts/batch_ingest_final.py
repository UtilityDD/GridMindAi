#!/usr/bin/env python3
"""Strict Batch Ingestion for Remaining Regulations using PRIMARY KEY ONLY."""

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

# --- STRICT KEY ENFORCEMENT ---
USER_PREFERRED_KEY = "AIzaSyD6XbvrhihEUEpVU8eL7djmHOsy2xoyg1g"
config.GEMINI_KEY_POOL = [USER_PREFERRED_KEY]
config.GEMINI_API_KEY = USER_PREFERRED_KEY
# ------------------------------

from scraper.download import download_pdfs
from pipeline.run import run_pipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.FileHandler(PROJECT_ROOT / "data" / "ingestion_status.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("final_ingest")

# Data path
DATA_PATH = PROJECT_ROOT / "wberc_data.json"

# In config.py: PIPELINE_WORKERS = 1
config.PIPELINE_WORKERS = 1
config.EMBEDDING_RATE_LIMIT_RPM = 10 # Safer for free tier

def main():
    if not DATA_PATH.exists():
        logger.error("wberc_data.json not found.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        wberc_data = json.load(f)

    # Indices to process (0-based)
    # S.No 6-27 -> Index 5-26
    # S.No 29-43 -> Index 28-42
    target_indices = list(range(5, 27)) + list(range(28, 43))
    
    logger.info(f"Starting FINAL batch ingestion for {len(target_indices)} targeted regulations...")
    logger.info(f"STRICTLY USING PRIMARY KEY: {USER_PREFERRED_KEY[:10]}...")

    for idx in target_indices:
        if idx >= len(wberc_data):
            continue
            
        reg = wberc_data[idx]
        logger.info(f"\n{'='*40}")
        logger.info(f"PROCESSING REG {idx+1}/{len(wberc_data)}: {reg['title']}")
        logger.info(f"{'='*40}")
        
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
        try:
            download_pdfs(pdfs_to_download)
            
            # 2. Run Pipeline
            # run_pipeline processes everything currently in manifest.json
            result = run_pipeline()
            logger.info(f"Pipeline Result: Success={result['success']}, Failed={result['failed']}")
            
        except Exception as e:
            logger.error(f"Critical error processing {reg['title']}: {e}")

        # Substantial delay to manage single-key free quota (1.5 Flash is 15 RPM)
        # However, a single PDF can have many pages/chunks.
        wait_time = 45 
        logger.info(f"Cool-down: Waiting {wait_time}s...")
        time.sleep(wait_time)

    logger.info("FINAL batch process finished.")

if __name__ == "__main__":
    main()
