#!/usr/bin/env python3
"""Queue extra documents (SOP and Electricity Act) for ingestion."""

import json
import logging
import sys
import requests
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from scraper.download import download_pdfs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("queue_extra")

def main():
    extra_records = [
        {
            "pdf_url": "https://www.wbsedcl.in/irj/go/km/docs/internet/webpage/PDF/46_WBERC(SOP)%20regulation%20.pdf",
            "ref": "46/WBERC-SOP",
            "date": "31/05/2010",
            "title": "WBERC (SOP) Regulation - WBSEDCL Version",
            "keywords": "standards of performance, consumer service, compensation"
        },
        {
            # Third Attempt: India Code Portal (NIC)
            "pdf_url": "https://www.indiacode.nic.in/bitstream/123456789/2058/1/A2003-36.pdf",
            "ref": "ACT-2003-CORRECTED",
            "date": "10.06.2003",
            "title": "THE ELECTRICITY ACT, 2003 (with Amendments)",
            "keywords": "electricity act, legislation, power sector, central"
        }
    ]

    logger.info("Downloading extra documents and updating manifest...")
    # download_pdfs will update adding_new_files/manifest.json safely
    new_count = download_pdfs(extra_records, skip_existing=False)
    logger.info(f"Queued {new_count} extra documents for ingestion.")

if __name__ == "__main__":
    main()
