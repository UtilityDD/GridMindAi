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

SOURCE_DIR = Path(r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Md")

def _make_doc_id(filename: str) -> str:
    return hashlib.sha256(filename.encode()).hexdigest()[:16]

def check_exists(doc_id, title, supabase):
    # 1. Primary Check: Doc ID hash
    res = supabase.table("titles").select("id").eq("doc_id", doc_id).execute()
    if len(res.data) > 0:
        return True
    
    # 2. Secondary Check: Title match (case-insensitive)
    res = supabase.table("titles").select("id").ilike("title", f"%{title}%").execute()
    if len(res.data) > 0:
        return True
        
    return False

def ingest_file(md_file: Path, supabase):
    filename = md_file.name
    title = md_file.stem
    doc_id = _make_doc_id(filename)
    
    if check_exists(doc_id, title, supabase):
        logger.info(f"Skipping {filename} - Already exists in RAG (DocID or Title match)")
        return

    # URL encoded filename for GitHub link
    pdf_filename = md_file.stem + ".pdf"
    encoded_filename = urllib.parse.quote(pdf_filename)
    source_url = f"https://github.com/smartlinemanapp/GridMind/blob/main/{encoded_filename}"
    
    # Extract Ref (First part of filename usually)
    ref = filename.split(" ")[0] if " " in filename else filename

    logger.info(f"Ingesting {filename}... (doc_id={doc_id})")
    
    with open(md_file, "r", encoding="utf-8") as f:
        text = f.read()

    if not text.strip():
        logger.warning(f"File is empty: {filename}")
        return

    chunks = chunk_text(text)
    logger.info(f"Produced {len(chunks)} chunks")

    # Embedding
    chunk_embeddings = embed_texts(chunks)
    
    metadata = {
        "ref": ref,
        "date": "2026", # Metadata standard
        "title": title,
        "source_url": source_url,
    }

    upsert_chunks(doc_id, chunks, chunk_embeddings, metadata)
    
    # Title & Summary
    title_text = f"Technical Specification: {title}"
    title_embedding = embed_single(title_text)
    upsert_title(doc_id, title_text, title_embedding, metadata)
    
    summary = summarize_document(text, ref=ref, date="2026")
    summary_embedding = embed_single(summary)
    upsert_summary(doc_id, summary, summary_embedding, metadata)
    
    logger.info(f"Completed {filename}")

def main():
    url = config.SUPABASE_URL
    key = config.SUPABASE_SERVICE_KEY
    supabase = create_client(url, key)

    md_files = list(SOURCE_DIR.glob("*.md"))
    logger.info(f"Found {len(md_files)} Markdown files for ingestion.")

    for i, md_file in enumerate(md_files):
        try:
            logger.info(f"Processing {i+1}/{len(md_files)}...")
            ingest_file(md_file, supabase)
        except Exception as e:
            logger.error(f"Failed to ingest {md_file.name}: {e}")

if __name__ == "__main__":
    main()
