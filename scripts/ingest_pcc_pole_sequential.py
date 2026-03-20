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

def main():
    # Setup paths
    input_file = Path(r"D:\Dipankar\MyCodes\AI Projects\indian_standards_markdown\Indian Standard PCC Pole.md")
    source_url = "https://github.com/smartlinemanapp/GridMind/blob/main/Indian%20Standard%20PCC%20Pole.pdf"
    
    if not input_file.exists():
        logger.error(f"Input file not found: {input_file}")
        return

    # Metadata for this document (IS 1678:1998)
    entry = {
        "ref": "IS 1678:1998",
        "date": "1998",
        "title": "IS 1678:1998 Prestressed Concrete Poles for Overhead Power, Traction and Telecommunication Lines",
        "source_url": source_url,
        "keywords": "PCC Pole, Prestressed Concrete, Overhead Lines, Power Transmission, IS 1678, M40 Concrete, Transverse Strength, Load Factor, Planting Depth"
    }

    doc_id = _make_doc_id(entry)
    metadata = {
        "ref": entry["ref"],
        "date": entry["date"],
        "title": entry["title"],
        "source_url": entry["source_url"],
    }

    logger.info(f"Processing doc_id={doc_id} for {entry['title']}")

    # Read content
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Chunking
    logger.info("Chunking text...")
    chunks = chunk_text(content)
    if not chunks:
        logger.error("No chunks produced")
        return
    logger.info(f"Produced {len(chunks)} chunks")

    # 2. Embedding
    logger.info(f"Ingesting {len(chunks)} chunks concurrently using key pool...")
    try:
        embeddings = embed_texts(chunks)
        logger.info(f"Successfully embedded {len(embeddings)} chunks.")
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return

    # 3. Summarization
    logger.info("Generating/Embedding summary...")
    try:
        summary = summarize_document(content, ref=entry["ref"], date=entry["date"])
        summary_embedding = embed_single(summary)
    except Exception as e:
        logger.warning(f"Summary generation or embedding failed: {e}")
        summary = None
        summary_embedding = None

    # 4. Title Embedding
    logger.info("Embedding title...")
    title_text = entry["title"]
    if entry.get("keywords"):
        title_text += f" | Keywords: {entry['keywords']}"
    
    title_embedding = None
    try:
        title_embedding = embed_single(title_text)
    except Exception as e:
        logger.error(f"Title embedding failed: {e}")

    # 5. Upserting to Supabase
    logger.info("Upserting to Supabase...")
    try:
        upsert_chunks(doc_id, chunks, embeddings, metadata)
        if summary and summary_embedding:
            upsert_summary(doc_id, summary, summary_embedding, metadata)
        if title_embedding:
            upsert_title(doc_id, title_text, title_embedding, metadata)
        logger.info("Ingestion complete!")
    except Exception as e:
        logger.error(f"Supabase upsert failed: {e}")

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
