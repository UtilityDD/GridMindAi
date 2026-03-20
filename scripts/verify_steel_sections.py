import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.supabase_writer import _get_client

def check_status():
    doc_id = "089107d4bfe96947"
    print(f"Checking status for doc_id: {doc_id}")
    
    client = _get_client()
    
    # Check chunks
    try:
        chunks = client.table("chunks").select("count", count="exact").eq("doc_id", doc_id).execute()
        count = chunks.count if hasattr(chunks, 'count') else 0
        print(f"Chunks found: {count}/16 (approx)")
        
        # Check document metadata
        doc = client.table("titles").select("*").eq("doc_id", doc_id).execute()
        if doc.data:
            print(f"Title entry found: {doc.data[0].get('title', 'N/A')}")
        else:
            print("Title entry NOT found yet (appears at the end).")
            
        summ = client.table("summaries").select("*").eq("doc_id", doc_id).execute()
        if summ.data:
            print("Summary entry found.")
        else:
            print("Summary entry NOT found yet.")
            
    except Exception as e:
        print(f"Error checking status: {e}")

if __name__ == "__main__":
    # doc_id is derived from: f"{entry.get('ref', '')}|{entry.get('date', '')}|{entry.get('source_url', '')}"
    # ref: "IS-808-1989", date: "17.03.2026", source_url: "https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/Indian%20Standard%20Steel%20Sections.pdf"
    import hashlib
    raw = "IS-808-1989|17.03.2026|https://raw.githubusercontent.com/smartlinemanapp/GridMind/main/Indian%20Standard%20Steel%20Sections.pdf"
    expected_doc_id = hashlib.sha256(raw.encode()).hexdigest()[:16]
    print(f"Calculated doc_id: {expected_doc_id}")
    check_status()
