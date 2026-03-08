import os
import hashlib
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def _make_doc_id(entry: dict) -> str:
    raw = f"{entry.get('ref', '')}|{entry.get('date', '')}|{entry.get('source_url', '')}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

entry = {
    "ref": "NBC-2005-LIGHT-VENT",
    "date": "08.03.2026",
    "source_url": "https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/Indian%20Standard%20Building%20Code%20for%20Light%20and%20Ventilation.pdf"
}

doc_id = _make_doc_id(entry)

def check_progress():
    print(f"Calculated Document ID: {doc_id}")
    
    # Check chunks count
    response = supabase.table("chunks").select("id", count="exact").eq("doc_id", doc_id).execute()
    chunk_count = response.count
    
    # Check summary count
    response = supabase.table("summaries").select("id", count="exact").eq("doc_id", doc_id).execute()
    summary_count = response.count
    
    # Check titles count
    response = supabase.table("titles").select("id", count="exact").eq("doc_id", doc_id).execute()
    title_count = response.count
    
    print(f"Stats for {doc_id}:")
    print(f" - Chunks: {chunk_count}")
    print(f" - Summaries: {summary_count}")
    print(f" - Titles: {title_count}")

    if chunk_count > 0:
        print("Progress: Ingestion partially or fully complete.")
    else:
        print("Progress: Not started or failed.")

if __name__ == "__main__":
    check_progress()
