import sys
import logging
import time
from pathlib import Path
import hashlib

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from pipeline.chunk import chunk_text
from pipeline.summarize import summarize_document
from pipeline.embed import embed_single
from pipeline.supabase_writer import upsert_chunks, upsert_summary, upsert_title

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# Use only the first verified valid key
config.GEMINI_KEY_POOL = [config.GEMINI_KEY_POOL[0]]

def _make_doc_id(entry: dict) -> str:
    raw = f"{entry.get('ref', '')}|{entry.get('date', '')}|{entry.get('source_url', '')}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

def main():
    md_file = Path(r"D:\Dipankar\MyCodes\AI Projects\indian_standards_markdown\Indian_Standard_ACSR_260307_184112.md")
    if not md_file.exists():
        logger.error(f"MD file not found at {md_file}")
        return

    entry = {
        "filename": "Indian Standard ACSR.pdf",
        "ref": "IS-398-PART-2-1996",
        "date": "17.03.2026",
        "title": "IS 398-2 (1996): Aluminium conductors for overhead transmission purposes, Part 2: Aluminium conductors, galvanized steel reinforced",
        "source_url": "https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/Indian%20Standard%20ACSR.pdf",
        "keywords": "ACSR, conductor, overhead transmission, aluminium, galvanized steel, IS 398, electrical standards"
    }

    doc_id = _make_doc_id(entry)
    metadata = {
        "ref": entry["ref"],
        "date": entry["date"],
        "title": entry["title"],
        "source_url": entry["source_url"],
    }

    with open(md_file, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = chunk_text(text)
    logger.info(f"Ingesting {len(chunks)} chunks sequentially with 12s delay...")

    embeddings = []
    for i, chunk in enumerate(chunks):
        logger.info(f"Embedding chunk {i+1}/{len(chunks)}...")
        try:
            emb = embed_single(chunk)
            embeddings.append(emb)
            logger.info("Done. Waiting 12s (RPM 15 limit safe)...")
            time.sleep(12)
        except Exception as e:
            logger.error(f"Failed at chunk {i+1}: {e}")
            return

    logger.info("Generating/Embedding summary...")
    summary = summarize_document(text, ref=entry["ref"], date=entry["date"])
    summary_embedding = embed_single(summary)
    time.sleep(10)

    logger.info("Embedding title...")
    title_text = entry["title"] + (f" | Keywords: {entry['keywords']}" if entry.get("keywords") else "")
    title_embedding = embed_single(title_text)

    logger.info("Upserting to Supabase...")
    upsert_chunks(doc_id, chunks, embeddings, metadata)
    upsert_summary(doc_id, summary, summary_embedding, metadata)
    upsert_title(doc_id, title_text, title_embedding, metadata)

    logger.info("Ingestion complete!")

if __name__ == "__main__":
    main()
