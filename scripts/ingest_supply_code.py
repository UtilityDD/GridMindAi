import os
import json
import logging
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import config and pipeline
import config
from scraper.download import download_pdfs
from pipeline.run import run_pipeline

logger = logging.getLogger("ingest_supply_code")

# Data path
DATA_PATH = PROJECT_ROOT / "wberc_data.json"

def main():
    if not DATA_PATH.exists():
        logger.error(f"Data file not found at {DATA_PATH}")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        wberc_data = json.load(f)

    # Regulation index 27 is S.No 28: WBERC (Electricity Supply Code) Regulations, 2013
    reg = wberc_data[27]
    logger.info(f"Targeting Regulation: {reg['title']}")

    # Flatten PDFs for download
    pdfs_to_download = []
    for p in reg["pdfs"]:
        pdfs_to_download.append({
            "pdf_url": p["url"],
            "ref": reg["ref"],
            "date": reg["date"],
            "title": f"{reg['title']} [{p['type']}]",
        })

    # Clear staging area to ensure we only process these files
    if config.ADDING_NEW_FILES_DIR.exists():
        logger.info("Clearing staging area...")
        for f in config.ADDING_NEW_FILES_DIR.glob("*"):
            if f.is_file():
                try:
                    f.unlink()
                except Exception as e:
                    logger.warning(f"Could not delete {f}: {e}")
        logger.info("Cleared staging area.")
    else:
        config.ADDING_NEW_FILES_DIR.mkdir(parents=True)

    # 1. Download PDFs
    logger.info(f"Phase 1: Downloading {len(pdfs_to_download)} PDFs...")
    new_count = download_pdfs(pdfs_to_download, skip_existing=False)
    logger.info(f"Successfully staged {new_count} PDFs.")
    
    # 2. Run Pipeline
    logger.info("Phase 2: Running Ingestion Pipeline...")
    # Explicitly set workers to 1 to avoid rate limit issues with Gemini Embedding/OCR
    config.PIPELINE_WORKERS = 1
    config.CHUNK_SIZE = 600 # Slightly larger chunks for legal docs
    
    result = run_pipeline()
    
    logger.info(f"Ingestion process complete.")
    logger.info(f"Summary: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    main()
