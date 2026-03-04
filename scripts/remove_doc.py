#!/usr/bin/env python3
"""Remove a document from the RAG system (Supabase and Filesystem)."""

import hashlib
import json
import logging
import sys
from pathlib import Path
from supabase import create_client

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("remove_doc")

def _make_doc_id(ref, date, source_url) -> str:
    raw = f"{ref}|{date}|{source_url}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

def main():
    # Target entry for broken Electricity Act
    target = {
        "filename": "electricity_act_2003.pdf",
        "ref": "ACT-2003",
        "date": "10.06.2003",
        "source_url": "https://cdnbbsr.s3waas.gov.in/s3716e1b8c6cd17b771da77391355749f3/uploads/2024/02/20240219885780629.pdf"
    }

    doc_id = _make_doc_id(target["ref"], target["date"], target["source_url"])
    logger.info(f"Target Doc ID to remove: {doc_id}")

    # 1. Supabase Removal
    try:
        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
        
        logger.info(f"Removing chunks for {doc_id}...")
        supabase.table("chunks").delete().eq("doc_id", doc_id).execute()
        
        logger.info(f"Removing summary for {doc_id}...")
        supabase.table("summaries").delete().eq("doc_id", doc_id).execute()
        
        logger.info(f"Removing title for {doc_id}...")
        supabase.table("titles").delete().eq("doc_id", doc_id).execute()
        
        logger.info("Supabase cleanup complete.")
    except Exception as e:
        logger.error(f"Supabase removal failed: {e}")

    # 2. Filesystem Removal
    pdf_path = config.PROXIED_PDFS_DIR if hasattr(config, "PROXIED_PDFS_DIR") else config.PROCESSED_PDFS_DIR / target["filename"]
    if pdf_path.exists():
        pdf_path.unlink()
        logger.info(f"Deleted PDF: {pdf_path}")
    else:
        logger.warning(f"PDF not found: {pdf_path}")

    # 3. Manifest Update
    if config.PROCESSED_MANIFEST_PATH.exists():
        with open(config.PROCESSED_MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        
        new_manifest = [e for e in manifest if _make_doc_id(e.get("ref",''), e.get("date",''), e.get("source_url",'')) != doc_id]
        
        if len(new_manifest) < len(manifest):
            with open(config.PROCESSED_MANIFEST_PATH, "w", encoding="utf-8") as f:
                json.dump(new_manifest, f, indent=2)
            logger.info(f"Updated manifest (removed {len(manifest) - len(new_manifest)} entries).")
        else:
            logger.warning("No entries found in manifest to remove.")

if __name__ == "__main__":
    main()
