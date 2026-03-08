import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def check_progress():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(url, key)
    
    doc_id = "3830c67d94cbedf7"
    res = supabase.table("chunks").select("count", count="exact").eq("doc_id", doc_id).execute()
    
    processed = supabase.table("titles").select("count", count="exact").eq("doc_id", doc_id).execute()
    is_done = (processed.count or 0) > 0
    
    print(f"Document ID: {doc_id}")
    print(f"Chunks uploaded: {res.count}")
    print(f"Final Title Uploaded: {'YES' if is_done else 'NO'}")

if __name__ == "__main__":
    check_progress()
