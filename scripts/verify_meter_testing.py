import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.supabase_writer import _get_client

def check_status():
    doc_id = "698cf1075000461c"
    print(f"Checking status for doc_id: {doc_id}")
    
    client = _get_client()
    
    # Check chunks
    try:
        chunks = client.table("chunks").select("count", count="exact").eq("doc_id", doc_id).execute()
        count = chunks.count if hasattr(chunks, 'count') else 0
        print(f"Chunks found: {count}/21")
        
        # Check document metadata (summaries and titles tables are used in this project)
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
    check_status()
