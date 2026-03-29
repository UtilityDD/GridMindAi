import os
import sys
import logging
import hashlib
import urllib.parse
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from pipeline.chunk import chunk_text
from pipeline.summarize import summarize_document
from pipeline.embed import embed_texts, embed_single
from pipeline.supabase_writer import upsert_chunks, upsert_summary, upsert_title
from supabase import create_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
SOURCE_DIR = Path(r"D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind\OCRs_PENDING")
GITHUB_BASE_URL = "https://github.com/smartlinemanapp/GridMind/blob/main/"

def _make_doc_id(filename: str) -> str:
    # Use a truncated hash to fit in the text fields of our chunks table
    return hashlib.sha256(filename.encode()).hexdigest()[:16]

def check_exists(doc_id, title, supabase):
    """Checks if the document already exists by ID or title."""
    # 1. Check Doc ID
    res = supabase.table("titles").select("id").eq("doc_id", doc_id).execute()
    if len(res.data) > 0:
        return True
    
    # 2. Check Title
    res = supabase.table("titles").select("id").eq("title", title).execute()
    return len(res.data) > 0

def ingest_file(md_file: Path, supabase):
    filename = md_file.name
    title = md_file.stem
    doc_id = _make_doc_id(filename)
    
    if check_exists(doc_id, title, supabase):
        logger.info(f"⏭️ Skipping {filename} - Already indexed.")
        return

    # --- URL MAPPING ---
    # User's request: https://github.com/smartlinemanapp/GridMind/blob/main/[Basename].pdf
    # Note: Filenames in GridMind might have spaces or special characters
    pdf_filename = md_file.stem + ".pdf"
    encoded_filename = urllib.parse.quote(pdf_filename)
    source_url = f"{GITHUB_BASE_URL}{encoded_filename}"
    
    # Ref: Usually the first part of the title (e.g., 'Ancillary Services')
    ref = title.split(",")[0] if "," in title else title.split(" ")[0]

    logger.info(f"🚀 Ingesting: {title} (ID: {doc_id})")
    
    with open(md_file, "r", encoding="utf-8") as f:
        text = f.read()

    if not text.strip():
        logger.warning(f"⚠️ Empty file detected: {filename}")
        return

    # 1. Chunking
    chunks = chunk_text(text)
    logger.info(f"   ∟ Generated {len(chunks)} fragments.")

    # 2. Embedding (Gemini API with Pacing)
    chunk_embeddings = embed_texts(chunks)
    
    metadata = {
        "ref": ref,
        "date": "2026", # Batch filing standard
        "title": title,
        "source_url": source_url,
    }

    # 3. Suppabase Writer - UPSERT CHUNKS
    upsert_chunks(doc_id, chunks, chunk_embeddings, metadata)
    
    # 4. TITLES & SUMMARIES
    # These provide context for the Explorer and the AI search
    title_text = f"Regulatory Archive: {title}"
    title_embedding = embed_single(title_text)
    upsert_title(doc_id, title_text, title_embedding, metadata)
    
    summary = summarize_document(text, ref=ref, date="2026")
    summary_embedding = embed_single(summary)
    upsert_summary(doc_id, summary, summary_embedding, metadata)
    
    logger.info(f"✅ Finished: {title}")

def main():
    if not SOURCE_DIR.exists():
        logger.error(f"❌ Source directory not found: {SOURCE_DIR}")
        return

    # Init Supabase
    url = config.SUPABASE_URL
    key = config.SUPABASE_SERVICE_KEY
    supabase = create_client(url, key)

    md_files = sorted(list(SOURCE_DIR.glob("*.md")))
    total_files = len(md_files)
    logger.info(f"📝 Found {total_files} regulatory documents for ingestion.")

    for i, md_file in enumerate(md_files):
        try:
            logger.info(f"[{i+1}/{total_files}] Processing...")
            ingest_file(md_file, supabase)
        except Exception as e:
            logger.error(f"❌ Critical Failure on {md_file.name}: {e}")
            # Continue to next file despite errors
            continue

    logger.info("🏁 Ingestion Process Completed.")

if __name__ == "__main__":
    main()
