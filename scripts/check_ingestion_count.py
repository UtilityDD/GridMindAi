import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

doc_id = "7499b5fe7d05bd19"

def check_progress():
    response = supabase.table("chunks").select("id", count="exact").eq("doc_id", doc_id).execute()
    count = response.count
    print(f"Total chunks in Supabase for {doc_id}: {count}")

if __name__ == "__main__":
    check_progress()
