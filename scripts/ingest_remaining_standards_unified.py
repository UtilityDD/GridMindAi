import os
import sys
import logging
import hashlib
import time
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from pipeline.chunk import chunk_text
from pipeline.summarize import summarize_document
from pipeline.embed import embed_texts, embed_single
from pipeline.supabase_writer import upsert_chunks, upsert_summary, upsert_title

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

def _make_doc_id(entry: dict) -> str:
    raw = f"{entry.get('ref', '')}|{entry.get('date', '')}|{entry.get('source_url', '')}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

def process_document(input_path, ref, date, title, source_url, keywords):
    input_file = Path(input_path)
    if not input_file.exists():
        logger.error(f"Input file not found: {input_file}")
        return

    entry = {
        "ref": ref,
        "date": date,
        "title": title,
        "source_url": source_url,
        "keywords": keywords
    }

    doc_id = _make_doc_id(entry)
    metadata = {
        "ref": entry["ref"],
        "date": entry["date"],
        "title": entry["title"],
        "source_url": entry["source_url"],
    }

    logger.info("="*50)
    logger.info(f"STARTING INCREMENTAL: {title} ({ref})")
    
    with os.fdopen(os.open(input_file, os.O_RDONLY), 'r', encoding='utf-8') as f:
        content = f.read()

    chunks = chunk_text(content)
    logger.info(f"Chunking done: {len(chunks)} chunks Produced.")

    # FAST EMBEDDING & UPSERTING
    logger.info(f"Starting parallel embedding for {len(chunks)} chunks...")
    try:
        embeddings = embed_texts(chunks)
        upsert_chunks(doc_id, chunks, embeddings, metadata)
        logger.info(f"Successfully upserted {len(chunks)} chunks to Supabase.")
    except Exception as e:
        logger.error(f"Failed to embed/upsert chunks: {e}")
        return

    # Final Title and Summary (only do once at end)
    logger.info("Finalizing Summary & Title...")
    try:
        title_text = f"{title} | {keywords}"
        title_embedding = embed_single(title_text)
        upsert_title(doc_id, title_text, title_embedding, metadata)
        
        summary = summarize_document(content, ref=entry["ref"], date=entry["date"])
        summary_embedding = embed_single(summary)
        upsert_summary(doc_id, summary, summary_embedding, metadata)
    except Exception as e:
        logger.warning(f"Finalization skipped due to error: {e}")

    logger.info(f"COMPLETED INCREMENTAL: {ref}")
    logger.info("="*50)

def main():
    docs = [
        {
            "path": r"D:\Dipankar\MyCodes\AI Projects\indian_standards_markdown\Indian Standard Building Code for Light and Ventilation.md",
            "ref": "NBC 2005 Group 4",
            "date": "2005",
            "title": "NBC 2005 Group 4: Building Code for Light and Ventilation",
            "source_url": "https://github.com/smartlinemanapp/GridMind/blob/main/Indian%20Standard%20Building%20Code%20for%20Light%20and%20Ventilation.pdf",
            "keywords": "Building Code, NBC 2005, Light, Ventilation, Architecture, Group 4"
        }
    ]
    for doc in docs:
        process_document(doc["path"], doc["ref"], doc["date"], doc["title"], doc["source_url"], doc["keywords"])

if __name__ == "__main__":
    main()
