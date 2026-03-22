import os
import sys
import logging
import hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

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

def ingest_single_file(i, supabase_url, supabase_key):
    """Worker function for a single file to allow outer parallelism."""
    # Create local client per thread to be safe
    supabase = create_client(supabase_url, supabase_key)
    
    md_path = rf"D:\Dipankar\MyCodes\AI Projects\finance_circulars_markdown\Covid19_Circulars ({i}).md"
    if not os.path.exists(md_path):
        return f"File ({i}) not found"

    entry = {
        "ref": f"FIN-CIRC-COVID19-{i}",
        "date": "2020-2022",
        "title": f"COVID-19 Circular ({i})",
        "source_url": f"https://github.com/smartlinemanapp/GridMind/blob/main/Covid19_Circulars%20({i}).md",
        "keywords": "Finance, COVID-19, Circular, WBSEDCL, Pandemic Policy"
    }

    doc_id = _make_doc_id(entry)
    
    with open(md_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Chunks are small, so this is fast
    chunks = chunk_text(text)
    
    # Neural processing (this uses the inner parallel engine)
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
    
    return f"Completed ({i})"

def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    # Use ThreadPoolExecutor to handle multiple files in parallel
    # NOTE: embed_texts also uses parallel threads.
    # Total threads = workers * embed_workers (10 * 10 = 100 max)
    # This will be extremely fast but might hit IP-based limits.
    # We rely on our key-rotation and backoff logic.
    workers = 5 # Moderate file parallelism to avoid saturating 429s too fast
    
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(ingest_single_file, i, supabase_url, supabase_key): i for i in range(1, 44)}
        
        for future in as_completed(futures):
            idx = futures[future]
            try:
                result = future.result()
                logger.info(f"Progress: {result}")
            except Exception as e:
                logger.error(f"Failed Circular ({idx}): {e}")

if __name__ == "__main__":
    main()
