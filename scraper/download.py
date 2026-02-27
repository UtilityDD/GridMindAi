"""Download PDFs into adding_new_files/ and maintain manifest.json."""

from __future__ import annotations

import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote

import requests

from config import ADDING_NEW_FILES_DIR, MANIFEST_PATH, DOWNLOAD_WORKERS

logger = logging.getLogger(__name__)

_manifest_lock = threading.Lock()


def _safe_filename(pdf_url: str) -> str:
    url_name = unquote(pdf_url.split("/")[-1])
    safe = "".join(c if c.isalnum() or c in "._- " else "_" for c in url_name)
    if not safe.lower().endswith(".pdf"):
        safe += ".pdf"
    return safe


def _load_manifest() -> list[dict]:
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _save_manifest(entries: list[dict]) -> None:
    ADDING_NEW_FILES_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def _download_one(rec: dict, dest: Path) -> bool:
    """Download a single PDF. Returns True on success."""
    url = rec["pdf_url"]
    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        dest.write_bytes(resp.content)
        return True
    except Exception:
        logger.exception("Failed to download %s", url)
        return False


def download_pdfs(
    records: list[dict],
    skip_existing: bool = True,
) -> int:
    """
    Download PDFs listed in *records* into adding_new_files/ using a thread pool.
    Updates manifest.json with metadata for each downloaded file.
    Returns number of newly downloaded files.
    """
    ADDING_NEW_FILES_DIR.mkdir(parents=True, exist_ok=True)
    manifest = _load_manifest()
    existing_urls = {e["source_url"] for e in manifest}

    to_download: list[tuple[dict, str, Path]] = []
    for rec in records:
        url = rec["pdf_url"]
        if skip_existing and url in existing_urls:
            continue
        filename = _safe_filename(url)
        dest = ADDING_NEW_FILES_DIR / filename
        if dest.exists() and skip_existing:
            entry = {
                "filename": filename,
                "ref": rec["ref"],
                "date": rec["date"],
                "title": rec["title"],
                "keywords": rec.get("keywords", ""),
                "source_url": url,
            }
            manifest.append(entry)
            existing_urls.add(url)
            continue
        to_download.append((rec, filename, dest))

    if not to_download:
        _save_manifest(manifest)
        logger.info("No new PDFs to download (manifest has %d)", len(manifest))
        return 0

    downloaded = 0
    logger.info("Downloading %d PDFs with %d workers…", len(to_download), DOWNLOAD_WORKERS)

    def _worker(item: tuple[dict, str, Path]) -> tuple[dict, str, bool]:
        rec, filename, dest = item
        ok = _download_one(rec, dest)
        return rec, filename, ok

    with ThreadPoolExecutor(max_workers=DOWNLOAD_WORKERS) as pool:
        futures = {pool.submit(_worker, item): item for item in to_download}
        for future in as_completed(futures):
            rec, filename, ok = future.result()
            if ok:
                entry = {
                    "filename": filename,
                    "ref": rec["ref"],
                    "date": rec["date"],
                    "title": rec["title"],
                    "keywords": rec.get("keywords", ""),
                    "source_url": rec["pdf_url"],
                }
                with _manifest_lock:
                    manifest.append(entry)
                    existing_urls.add(rec["pdf_url"])
                downloaded += 1
                if downloaded % 50 == 0:
                    with _manifest_lock:
                        _save_manifest(manifest)
                    logger.info("Progress: %d / %d downloaded", downloaded, len(to_download))

    _save_manifest(manifest)
    logger.info("Downloaded %d new PDFs (total in manifest: %d)", downloaded, len(manifest))
    return downloaded
