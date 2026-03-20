import sys
import logging
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from pipeline.supabase_writer import _get_client

def check_status():
    doc_id = "6b00e35d701f654b"
    print(f"Checking status for doc_id: {doc_id}")
    
    client = _get_client()
    
    # Check chunks (count from the exact table)
    try:
        chunks = client.table("chunks").select("count", count="exact").eq("doc_id", doc_id).execute()
        count = chunks.count if hasattr(chunks, 'count') else 0
        print(f"Chunks found: {count}/37")
        
        # Check document
        doc = client.table("documents").select("*").eq("id", doc_id).execute()
        if doc.data:
            print(f"Document entry found: {doc.data[0]['title']}")
        else:
            print("Document entry NOT found yet (it appears at the end of sequential script).")
    except Exception as e:
        print(f"Error checking status: {e}")

if __name__ == "__main__":
    check_status()
