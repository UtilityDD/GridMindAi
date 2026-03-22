import os
import sys
import logging
import hashlib
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

def _make_doc_id(entry: dict) -> str:
    raw = f"{entry.get('ref', '')}|{entry.get('date', '')}|{entry.get('source_url', '')}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

def check_exists(doc_id, title, supabase):
    # Check by doc_id
    res = supabase.table("titles").select("id").eq("doc_id", doc_id).execute()
    if len(res.data) > 0:
        return True
    
    # Check by Title (fuzzy)
    res = supabase.table("titles").select("id").ilike("title", f"%{title}%").execute()
    return len(res.data) > 0

def ingest_file(i, supabase):
    md_path = rf"D:\Dipankar\MyCodes\AI Projects\finance_circulars_markdown\Cash & Treasury ({i}).md"
    if not os.path.exists(md_path):
        logger.warning(f"File not found: {md_path}")
        return

    entry = {
        "ref": f"FIN-CIRC-CASH-TREASURY-{i}",
        "date": "2024", # Default
        "title": f"Cash & Treasury - Circular ({i})",
        "source_url": f"https://github.com/smartlinemanapp/GridMind/blob/main/Cash%20%26%20Treasury%20({i}).pdf",
        "keywords": "Finance, Cash, Treasury, Circular, WBSEDCL"
    }

    doc_id = _make_doc_id(entry)
    
    if check_exists(doc_id, entry["title"], supabase):
        logger.info(f"Skipping Circular ({i}) - Already exists in Supabase (doc_id={doc_id} or Title matched)")
        return

    logger.info(f"Ingesting Circular ({i})... (doc_id={doc_id})")
    
    with open(md_path, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = chunk_text(text)
    logger.info(f"Produced {len(chunks)} chunks")

    # Fast parallel embedding
    chunk_embeddings = embed_texts(chunks)
    
    metadata = {
        "ref": entry["ref"],
        "date": entry["date"],
        "title": entry["title"],
        "source_url": entry["source_url"],
    }

    upsert_chunks(doc_id, chunks, chunk_embeddings, metadata)
    
    # Title & Summary
    title_text = f"{entry['title']} | Keywords: {entry['keywords']}"
    title_embedding = embed_single(title_text)
    upsert_title(doc_id, title_text, title_embedding, metadata)
    
    summary = summarize_document(text, ref=entry["ref"], date=entry["date"])
    summary_embedding = embed_single(summary)
    upsert_summary(doc_id, summary, summary_embedding, metadata)
    
    logger.info(f"Completed Circular ({i})")

def main():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(url, key)

    for i in range(1, 20):
        try:
            ingest_file(i, supabase)
        except Exception as e:
            logger.error(f"Failed to ingest Circular ({i}): {e}")

if __name__ == "__main__":
    main()
