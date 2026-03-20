import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(PROJECT_ROOT / "frontend" / ".env.local")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Supabase URL or Key missing.")
    exit(1)

supabase: Client = create_client(url, key)

def check_status():
    doc_id = "ccdcb60eb9d7a7fb"
    print(f"Checking status for doc_id: {doc_id}")
    
    # Check chunks
    chunks = supabase.table("chunks").select("count", count="exact").eq("doc_id", doc_id).execute()
    print(f"Chunks found: {chunks.count if hasattr(chunks, 'count') else 0}")
    
    # Check document
    doc = supabase.table("documents").select("*").eq("id", doc_id).execute()
    if doc.data:
        print(f"Document entry found: {doc.data[0]['title']}")
    else:
        print("Document entry NOT found.")

if __name__ == "__main__":
    check_status()
