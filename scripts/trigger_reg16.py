import logging
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.run import run_pipeline
import config

# Configure logging to console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)

if __name__ == "__main__":
    print("Starting Manual Ingestion for Regulation 16...")
    # Force single worker for stability
    config.PIPELINE_WORKERS = 1
    result = run_pipeline()
    print(f"Ingestion Result: {result}")
