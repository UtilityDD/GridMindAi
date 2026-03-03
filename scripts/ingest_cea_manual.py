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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest_manual")

def main():
    # Target Document details
    manual_name = "CEA Construction Technical Standards"
    manual_url = "https://github.com/smartlinemanapp/GridMind/raw/main/CEA%20Technical%20Standard%20of%20Construction%20Regulations-117-213.pdf"
    manual_ref = "CEA Construction 2023"
    manual_date = "01/01/2023"

    pdfs_to_download = [{
        "pdf_url": manual_url,
        "ref": manual_ref,
        "date": manual_date,
        "title": manual_name,
    }]

    # Clear staging area
    if config.ADDING_NEW_FILES_DIR.exists():
        logger.info("Clearing staging area...")
        for f in config.ADDING_NEW_FILES_DIR.glob("*"):
            if f.is_file():
                try:
                    f.unlink()
                except Exception as e:
                    logger.warning(f"Could not delete {f}: {e}")
    else:
        config.ADDING_NEW_FILES_DIR.mkdir(parents=True)

    # 1. Download PDFs
    logger.info(f"Phase 1: Downloading manual from GitHub...")
    new_count = download_pdfs(pdfs_to_download, skip_existing=False)
    if new_count == 0:
        logger.error("Failed to download manual.")
        return
    
    # 2. Run Pipeline
    logger.info("Phase 2: Running Ingestion Pipeline...")
    config.PIPELINE_WORKERS = 1
    config.CHUNK_SIZE = 800 # Manuals often have longer thematic sections
    config.OCR_USE_GEMINI = True # Safety regs might have table/diag
    
    result = run_pipeline()
    
    logger.info(f"Ingestion process complete.")
    logger.info(f"Summary: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    main()
