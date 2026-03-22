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
    supabase = create_client(supabase_url, supabase_key)
    
    md_path = rf"D:\Dipankar\MyCodes\AI Projects\finance_circulars_markdown\Office_Orders_Circulars_Shared ({i}).md"
    md_path_completed = rf"D:\Dipankar\MyCodes\AI Projects\finance_circulars_markdown\completed\Office_Orders_Circulars_Shared ({i}).md"
    
    if os.path.exists(md_path):
        current_path = md_path
    elif os.path.exists(md_path_completed):
        current_path = md_path_completed
    else:
        return f"File ({i}) not found in root or completed folder"

    entry = {
        "ref": f"FIN-OFF-SHARED-{i}",
        "date": "2024",
        "title": f"Office Orders & Circulars Shared ({i})",
        "source_url": f"https://github.com/smartlinemanapp/GridMind/blob/main/Office_Orders_Circulars_Shared%20({i}).pdf",
        "keywords": "Finance, Office Order, Circular, Shared, WBSEDCL"
    }

    doc_id = _make_doc_id(entry)
    
    with open(current_path, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = chunk_text(text)
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
    
    return f"Completed ({i})"

def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    workers = 5
    with ThreadPoolExecutor(max_workers=workers) as executor:
        missing_ids = [39, 81]
        futures = {executor.submit(ingest_single_file, i, supabase_url, supabase_key): i for i in missing_ids}
        
        for future in as_completed(futures):
            idx = futures[future]
            try:
                result = future.result()
                logger.info(f"Progress: {result}")
            except Exception as e:
                logger.error(f"Failed Circular ({idx}): {e}")

if __name__ == "__main__":
    main()
