"""CLI entry point: scrape, pipeline, ask, and add-manifest commands."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import config


def _setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
        datefmt="%H:%M:%S",
    )


# ── Commands ─────────────────────────────────────────────────────────

def cmd_scrape(args: argparse.Namespace) -> None:
    """Scrape the website and download PDFs into adding_new_files/."""
    from scraper.fetcher import fetch_page
    from scraper.parser import parse_circulars
    from scraper.download import download_pdfs

    print("Fetching page…")
    html = fetch_page()

    print("Parsing circulars…")
    records = parse_circulars(html)
    print(f"Found {len(records)} circulars on the page.")

    if args.dry_run:
        for r in records[:10]:
            print(f"  {r['ref']}  {r['date']}  {r['title'][:60]}")
        if len(records) > 10:
            print(f"  … and {len(records) - 10} more")
        return

    print("Downloading PDFs…")
    count = download_pdfs(records, skip_existing=not args.force)
    print(f"Downloaded {count} new PDFs into adding_new_files/")


def cmd_pipeline(args: argparse.Namespace) -> None:
    """Run the ingestion pipeline on adding_new_files/."""
    from pipeline.run import run_pipeline

    use_gemini = None
    if args.ocr == "gemini":
        use_gemini = True
    elif args.ocr == "tesseract":
        use_gemini = False

    result = run_pipeline(use_gemini_ocr=use_gemini)
    print(f"\nPipeline complete:")
    print(f"  Total:   {result['total']}")
    print(f"  Success: {result['success']}")
    print(f"  Failed:  {result['failed']}")
    if result.get("failed_files"):
        print(f"  Failed files: {result['failed_files']}")


def cmd_ask(args: argparse.Namespace) -> None:
    """Ask a question against the indexed circulars."""
    from retrieval.three_way import retrieve
    from retrieval.context_builder import build_context
    from generation.llm import generate_answer

    question = " ".join(args.question)
    if not question.strip():
        print("Please provide a question.")
        return

    print(f"Searching for: {question}\n")

    retrieval_result = retrieve(question)

    rewritten = retrieval_result.get("rewritten_query")
    if rewritten and rewritten != question:
        print(f"Optimized query: {rewritten}\n")

    if not retrieval_result["doc_ids"]:
        print("No relevant documents found.")
        return

    context, sources = build_context(retrieval_result)
    result = generate_answer(question, context, sources)

    print(result["answer"])
    print(f"\n{'─'*60}")
    print(f"Model used: {result['model_used']}")
    print(f"Sources ({len(result['sources'])}):")
    for s in result["sources"]:
        print(f"  • {s['ref']} ({s['date']}): {s['title']}")
        if s.get("source_url"):
            print(f"    {s['source_url']}")


def cmd_add_manifest(args: argparse.Namespace) -> None:
    """Add a manual entry to the staging manifest for a PDF already in adding_new_files/."""
    pdf_path = config.ADDING_NEW_FILES_DIR / args.filename
    if not pdf_path.exists():
        print(f"Error: {pdf_path} does not exist. Place the PDF in adding_new_files/ first.")
        return

    manifest: list[dict] = []
    if config.MANIFEST_PATH.exists():
        with open(config.MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest = json.load(f)

    entry = {
        "filename": args.filename,
        "ref": args.ref or "",
        "date": args.date or "",
        "title": args.title or "",
        "keywords": "",
        "source_url": "",
    }
    manifest.append(entry)

    with open(config.MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"Added {args.filename} to manifest.json")


# ── Parser ───────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="wbsedcl-rag",
        description="WBSEDCL Circulars RAG System",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose logging")
    sub = parser.add_subparsers(dest="command")

    # scrape
    p_scrape = sub.add_parser("scrape", help="Scrape website and download PDFs")
    p_scrape.add_argument("--dry-run", action="store_true", help="Parse only, don't download")
    p_scrape.add_argument("--force", action="store_true", help="Re-download existing files")

    # pipeline
    p_pipeline = sub.add_parser("pipeline", help="Run ingestion pipeline on adding_new_files/")
    p_pipeline.add_argument(
        "--ocr",
        choices=["gemini", "tesseract", "auto"],
        default="auto",
        help="OCR method (default: auto, uses config)",
    )

    # ask
    p_ask = sub.add_parser("ask", help="Ask a question")
    p_ask.add_argument("question", nargs="+", help="Your question")

    # add-manifest
    p_add = sub.add_parser("add-manifest", help="Add a manual PDF to the manifest")
    p_add.add_argument("filename", help="PDF filename (must be in adding_new_files/)")
    p_add.add_argument("--ref", default="", help="Order/Circular reference number")
    p_add.add_argument("--date", default="", help="Date of the circular")
    p_add.add_argument("--title", default="", help="Title / subject of the circular")

    args = parser.parse_args()
    _setup_logging(args.verbose)

    if args.command == "scrape":
        cmd_scrape(args)
    elif args.command == "pipeline":
        cmd_pipeline(args)
    elif args.command == "ask":
        cmd_ask(args)
    elif args.command == "add-manifest":
        cmd_add_manifest(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
