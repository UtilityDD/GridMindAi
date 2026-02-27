#!/usr/bin/env python3
"""Convenience script: scrape the website and download PDFs into adding_new_files/."""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scraper.fetcher import fetch_page
from scraper.parser import parse_circulars
from scraper.download import download_pdfs

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)


def main() -> None:
    print("Fetching DCLorder.php…")
    html = fetch_page()

    print("Parsing circulars table…")
    records = parse_circulars(html)
    print(f"Found {len(records)} circulars.")

    print("Downloading new PDFs into adding_new_files/…")
    count = download_pdfs(records, skip_existing=True)
    print(f"Done. Downloaded {count} new PDFs.")


if __name__ == "__main__":
    main()
