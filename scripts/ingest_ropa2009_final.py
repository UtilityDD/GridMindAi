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

def main():
    md_path = r"D:\Dipankar\MyCodes\AI Projects\finance_circulars_markdown\ROPA2009 (54).md"
    if not os.path.exists(md_path):
        logger.error(f"File not found: {md_path}")
        return

    entry = {
        "ref": "FIN-ROPA2009-54",
        "date": "2009",
        "title": "ROPA 2009 (54) - Revision of Pay",
        "source_url": "https://github.com/smartlinemanapp/GridMind/blob/main/ROPA2009.pdf",
        "keywords": "Finance, ROPA, 2009, WBSEDCL, Salary Revision, Master Guide"
    }

    doc_id = _make_doc_id(entry)
    logger.info(f"Ingesting ROPA 2009 (54)... (doc_id={doc_id})")
    
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
    
    title_text = f"{entry['title']} | Keywords: {entry['keywords']}"
    title_embedding = embed_single(title_text)
    upsert_title(doc_id, title_text, title_embedding, metadata)
    
    summary = summarize_document(text, ref=entry["ref"], date=entry["date"])
    summary_embedding = embed_single(summary)
    upsert_summary(doc_id, summary, summary_embedding, metadata)
    
    logger.info("Completed ROPA 2009 (54) Ingestion")

if __name__ == "__main__":
    main()
