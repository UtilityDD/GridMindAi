import sys
import logging
from pathlib import Path
import hashlib

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from pipeline.chunk import chunk_text
from pipeline.summarize import summarize_document
from pipeline.embed import embed_texts, embed_single
from pipeline.supabase_writer import upsert_chunks, upsert_summary, upsert_title

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

def _make_doc_id(entry: dict) -> str:
    raw = f"{entry.get('ref', '')}|{entry.get('date', '')}|{entry.get('source_url', '')}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

def main():
    md_file = PROJECT_ROOT / "data" / "Indian Standard Building Code for Light and Ventilation.md"
    if not md_file.exists():
        logger.error(f"MD file not found at {md_file}")
        return

    entry = {
        "filename": "Indian Standard Building Code for Light and Ventilation.pdf",
        "ref": "NBC-2005-LIGHT-VENT",
        "date": "08.03.2026",
        "title": "National Building Code of India 2005 - Part 8 Section 1: Lighting and Ventilation",
        "source_url": "https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/Indian%20Standard%20Building%20Code%20for%20Light%20and%20Ventilation.pdf",
        "keywords": "lighting, ventilation, building code, BIS, NBC 2005"
    }

    doc_id = _make_doc_id(entry)
    metadata = {
        "ref": entry["ref"],
        "date": entry["date"],
        "title": entry["title"],
        "source_url": entry["source_url"],
    }

    logger.info(f"Processing doc_id={doc_id} for {entry['title']}")

    # 1. Read MD content
    with open(md_file, "r", encoding="utf-8") as f:
        text = f.read()

    if not text.strip():
        logger.error("MD file is empty")
        return

    # 2. Chunk
    logger.info("Chunking text...")
    chunks = chunk_text(text)
    if not chunks:
        logger.error("No chunks produced")
        return
    logger.info(f"Produced {len(chunks)} chunks")

    # 3. Summarize
    logger.info("Generating summary...")
    summary = summarize_document(text, ref=entry["ref"], date=entry["date"])
    logger.info("Summary generated")

    # 4. Embed
    logger.info(f"Embedding {len(chunks)} chunks in Big Batches (this will take ~15-20 minutes)...")
    try:
        # Our embed_texts now handles the sequential delay
        chunk_embeddings = embed_texts(chunks)
    except Exception as e:
        logger.error(f"Chunk embedding failed: {e}")
        return

    summary_embedding = None
    if summary:
        logger.info("Embedding summary...")
        try:
            summary_embedding = embed_single(summary)
        except Exception as e:
            logger.error(f"Summary embedding failed: {e}")

    title_text = entry["title"]
    if entry.get("keywords"):
        title_text += f" | Keywords: {entry['keywords']}"
    
    logger.info("Embedding title...")
    title_embedding = None
    try:
        title_embedding = embed_single(title_text)
    except Exception as e:
        logger.error(f"Title embedding failed: {e}")

    # 5. Upsert to Supabase
    logger.info("Upserting to Supabase...")
    upsert_chunks(doc_id, chunks, chunk_embeddings, metadata)
    
    if summary and summary_embedding:
        upsert_summary(doc_id, summary, summary_embedding, metadata)
    
    if title_embedding:
        upsert_title(doc_id, title_text, title_embedding, metadata)

    logger.info("Ingestion complete!")

if __name__ == "__main__":
    main()
