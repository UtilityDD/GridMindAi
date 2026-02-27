"""Move processed PDFs from adding_new_files/ to data/processed_pdfs/."""

from __future__ import annotations

import json
import logging
import shutil
from pathlib import Path

import config

logger = logging.getLogger(__name__)


def move_file(filename: str) -> None:
    """Move a single PDF from the staging folder to processed_pdfs/."""
    src = config.ADDING_NEW_FILES_DIR / filename
    config.PROCESSED_PDFS_DIR.mkdir(parents=True, exist_ok=True)
    dst = config.PROCESSED_PDFS_DIR / filename

    if not src.exists():
        logger.warning("Source file not found, skipping move: %s", src)
        return

    shutil.move(str(src), str(dst))
    logger.info("Moved %s → %s", src, dst)


def update_manifests(entry: dict) -> None:
    """
    Remove *entry* from adding_new_files/manifest.json and
    append it to data/processed_manifest.json.
    """
    # Remove from staging manifest
    if config.MANIFEST_PATH.exists():
        with open(config.MANIFEST_PATH, "r", encoding="utf-8") as f:
            staging = json.load(f)
        staging = [e for e in staging if e.get("filename") != entry["filename"]]
        with open(config.MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(staging, f, indent=2, ensure_ascii=False)

    # Append to processed manifest
    processed: list[dict] = []
    if config.PROCESSED_MANIFEST_PATH.exists():
        with open(config.PROCESSED_MANIFEST_PATH, "r", encoding="utf-8") as f:
            processed = json.load(f)
    processed.append(entry)
    with open(config.PROCESSED_MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)
