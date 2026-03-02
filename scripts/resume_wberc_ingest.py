#!/usr/bin/env python3
"""Resume batch ingestion for WBERC regulations starting from Regulation 5."""

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
logger = logging.getLogger("resume_ingest")

# Data path
DATA_PATH = PROJECT_ROOT / "wberc_data.json"

def main():
    if not DATA_PATH.exists():
        logger.error(f"Data file not found at {DATA_PATH}.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        wberc_data = json.load(f)

    # We want to start from Regulation 5 (index 4)
    pending_data = wberc_data[4:]
    
    logger.info(f"Resuming ingestion for {len(pending_data)} pending regulations (Reg 5 to 43)...")

    # Ensure sequential processing for stability
    config.PIPELINE_WORKERS = 1
    logger.info("Enforced PIPELINE_WORKERS=1 for sequential processing.")

    for i, reg in enumerate(pending_data):
        # Check for pause flag
        if (PROJECT_ROOT / "pause_ingest.flag").exists():
            logger.info("Pause flag detected. Stopping after current regulation completion (if any).")
            break

        current_reg_num = i + 5
        logger.info(f"\n{'='*30}")
        logger.info(f"Processing Regulation {current_reg_num}/43: {reg['title']}")
        logger.info(f"{'='*30}")
        
        # Flatten PDFs for download
        pdfs_to_download = []
        for p in reg["pdfs"]:
            pdfs_to_download.append({
                "pdf_url": p["url"],
                "ref": reg["ref"],
                "date": reg["date"],
                "title": f"{reg['title']} [{p['type']}]",
            })

        # 1. Download PDFs (Staging)
        logger.info(f"Phase 1: Downloading {len(pdfs_to_download)} PDFs...")
        new_count = download_pdfs(pdfs_to_download)
        logger.info(f"Staged {new_count} new PDFs/metadata into manifest.")
        
        # 2. Run Pipeline (Processing staged files)
        logger.info("Phase 2: Running Ingestion Pipeline...")
        result = run_pipeline()
        
        logger.info(f"Result for Reg {current_reg_num}: {result}")
        
        # Delay to stay within rate limits (Gemini 2.5/2.0 Flash limits can be tight on free tier)
        if i < len(pending_data) - 1:
            wait_time = 45 # Increased delay for safety
            logger.info(f"Rate Limit Guard: Waiting {wait_time} seconds...")
            time.sleep(wait_time)

    logger.info("Resume process completed for all pending regulations.")

if __name__ == "__main__":
    main()
