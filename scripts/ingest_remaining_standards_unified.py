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
    logger.info(f"STARTING: {title} ({ref})")
    logger.info(f"doc_id: {doc_id}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    logger.info("Chunking...")
    chunks = chunk_text(content)
    logger.info(f"Produced {len(chunks)} chunks")

    logger.info("Embedding chunks (SEQUENTIAL ACROSS ALL KEYS)...")
    try:
        embeddings = embed_texts(chunks) # Now max_workers=1 and 3s stagger inside
        logger.info(f"Successfully embedded {len(embeddings)} chunks.")
    except Exception as e:
        logger.error(f"Embedding failed for {ref}: {e}")
        return

    logger.info("Summarizing...")
    try:
        summary = summarize_document(content, ref=entry["ref"], date=entry["date"])
        summary_embedding = embed_single(summary)
    except Exception as e:
        logger.warning(f"Summary failed: {e}")
        summary, summary_embedding = None, None

    logger.info("Embedding title...")
    title_text = f"{title} | {keywords}"
    title_embedding = embed_single(title_text)

    logger.info("Upserting to Supabase...")
    upsert_chunks(doc_id, chunks, embeddings, metadata)
    if summary and summary_embedding:
        upsert_summary(doc_id, summary, summary_embedding, metadata)
    upsert_title(doc_id, title_text, title_embedding, metadata)
    
    logger.info(f"COMPLETED: {ref}")
    logger.info("="*50)

def main():
    docs = [
        {
            "path": r"D:\Dipankar\MyCodes\AI Projects\indian_standards_markdown\Indian Standard OH Line upto 11KV Sec-1.md",
            "ref": "IS 5613-1-1:1985",
            "date": "1985",
            "title": "IS 5613 (Part 1/Sec 1): Code of Practice for Design of Overhead Power Lines (Up to 11 kV)",
            "source_url": "https://github.com/smartlinemanapp/GridMind/blob/main/Indian%20Standard%20OH%20Line%20upto%2011KV%20Sec-1.pdf",
            "keywords": "Overhead Lines, 11kV, Design, ACSR, Sag-Tension, Spacing"
        },
        {
            "path": r"D:\Dipankar\MyCodes\AI Projects\indian_standards_markdown\Indian Standard PCC Pole.md",
            "ref": "IS 1678:1998",
            "date": "1998",
            "title": "IS 1678:1998 Prestressed Concrete Poles for Overhead Lines",
            "source_url": "https://github.com/smartlinemanapp/GridMind/blob/main/Indian%20Standard%20PCC%20Pole.pdf",
            "keywords": "PCC Pole, Concrete, Overhead Lines, IS 1678, Structural"
        },
        {
            "path": r"D:\Dipankar\MyCodes\AI Projects\indian_standards_markdown\Indian Standard Steel Sections.md",
            "ref": "IS 808:1989",
            "date": "1989",
            "title": "IS 808:1989 Dimensions for Hot Rolled Steel Sections",
            "source_url": "https://github.com/smartlinemanapp/GridMind/blob/main/Indian%20Standard%20Steel%20Sections.pdf",
            "keywords": "Steel Sections, IS 808, Beam, Channel, Angle, Dimensions"
        }
    ]

    for doc in docs:
        process_document(doc["path"], doc["ref"], doc["date"], doc["title"], doc["source_url"], doc["keywords"])
        logger.info("Doc complete. Waiting 10s before next doc for safety...")
        time.sleep(10)

if __name__ == "__main__":
    main()
