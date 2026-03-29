"""
OCR Batch Processor for 'OCR Required for GridMind' folder.
Uses IBM Docling (process-isolated) to convert PDFs to Markdown.
- Source PDFs: D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind\
- Output MDs:  D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind\OCRs_PENDING\
- .md file names will exactly match the .pdf file names (same basename).
- Already processed files (>5KB .md with no [OCR ERROR]) are skipped.
"""

import os
import sys
import time
import subprocess
from pathlib import Path

# Enforce UTF-8 for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SOURCE_DIR = Path(r"D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind")
TARGET_DIR = SOURCE_DIR / "OCRs_PENDING"

TARGET_DIR.mkdir(parents=True, exist_ok=True)


def process_single_file(pdf_path: str, md_path: str) -> bool:
    """Single-file worker: called by child process."""
    try:
        from docling.document_converter import DocumentConverter
        print(f"  [WORKER] Converting: {Path(pdf_path).name}", flush=True)
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        md_text = result.document.export_to_markdown()

        if len(md_text.strip()) < 200:
            raise ValueError("Docling produced blank/insufficient output (likely scanned image with no OCR data)")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_text)
        return True
    except Exception as e:
        print(f"  [WORKER] ERROR: {e}", flush=True)
        # Write a short error marker so the orchestrator can detect it
        try:
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(f"[OCR ERROR] {e}\n")
        except Exception:
            pass
        return False


def process_isolated(pdf_path: Path, md_path: Path) -> bool:
    """Spawns a fresh Python process for each PDF to reclaim RAM between files."""
    try:
        result = subprocess.run(
            [sys.executable, str(Path(__file__).resolve()), str(pdf_path), str(md_path)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=600,  # 10-minute limit per file
        )
        if result.stdout:
            print(result.stdout.strip(), flush=True)
        if result.returncode != 0 and result.stderr:
            print(f"  [CHILD STDERR] {result.stderr.strip()[:200]}", flush=True)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"  ⏰ TIMEOUT on {pdf_path.name}", flush=True)
        return False


def is_done(md_path: Path) -> bool:
    """Returns True if the md exists, is >5KB, and has no [OCR ERROR] tag."""
    if not md_path.exists():
        return False
    if md_path.stat().st_size < 5120:
        return False
    try:
        head = md_path.read_text(encoding="utf-8", errors="ignore")[:512]
        if "[OCR ERROR]" in head or "[ERROR]" in head:
            return False
    except Exception:
        return False
    return True


def main():
    # ── WORKER MODE (called by process_isolated) ──────────────────────────────
    if len(sys.argv) == 3:
        process_single_file(sys.argv[1], sys.argv[2])
        return

    # ── ORCHESTRATOR MODE ─────────────────────────────────────────────────────
    all_pdfs = sorted(SOURCE_DIR.glob("*.pdf"))
    total = len(all_pdfs)

    if total == 0:
        print("✅ No PDFs found directly inside the source folder.", flush=True)
        return

    print(f"\n🚀 GridMind OCR Batch — {total} PDFs found in source folder.", flush=True)
    print(f"   Output directory: {TARGET_DIR}\n", flush=True)

    skipped, success_count, fail_count = 0, 0, 0

    for i, pdf_path in enumerate(all_pdfs, 1):
        # .md name exactly matches .pdf name
        md_path = TARGET_DIR / (pdf_path.stem + ".md")

        if is_done(md_path):
            print(f"[{i}/{total}] ⏭️  SKIPPED (already done): {pdf_path.name}", flush=True)
            skipped += 1
            continue

        print(f"[{i}/{total}] 📄 Processing: {pdf_path.name}", flush=True)
        ok = process_isolated(pdf_path, md_path)

        if ok and md_path.exists() and md_path.stat().st_size > 200:
            print(f"[{i}/{total}] ✅ SUCCESS  → {md_path.name}", flush=True)
            success_count += 1
        else:
            print(f"[{i}/{total}] ❌ FAILED   → {pdf_path.name}", flush=True)
            fail_count += 1

        time.sleep(0.5)  # brief I/O pause

    print(f"\n{'='*60}", flush=True)
    print(f"✅ Completed : {success_count}", flush=True)
    print(f"⏭️  Skipped   : {skipped}", flush=True)
    print(f"❌ Failed    : {fail_count}", flush=True)
    print(f"{'='*60}\n", flush=True)


if __name__ == "__main__":
    main()
