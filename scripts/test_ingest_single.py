import sys
from pathlib import Path
import logging
import json

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from pipeline.run import process_entry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

def main():
    manifest_path = config.MANIFEST_PATH
    if not manifest_path.exists():
        print(f"Manifest not found at {manifest_path}")
        return

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    
    # Target "Regulation 81.pdf"
    target = next((e for e in manifest if e["filename"] == "Regulation 81.pdf"), None)
    if not target:
        print(f"Target 'Regulation 81.pdf' not found in manifest at {manifest_path}")
        print("Available files:", [e['filename'] for e in manifest])
        return

    print(f"Testing ingestion for {target['filename']}...")
    ok = process_entry(target)
    print(f"Result: SUCCESS" if ok else "Result: FAILED")

if __name__ == "__main__":
    main()
