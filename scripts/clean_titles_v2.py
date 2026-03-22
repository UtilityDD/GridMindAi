import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

def clean_text(text):
    if not text: return text
    # Pattern to match anything like (https://github.com/...)
    return re.sub(r'\(https?://[^\)]+\)', '', text).strip()

def run_cleanup():
    print("Starting title cleanup for Link Leak...")
    
    # 1. Clean Titles Table
    res = supabase.table("titles").select("id, title").ilike("title", "%http%").execute()
    print(f"Found {len(res.data)} titles to clean.")
    
    for row in res.data:
        new_title = clean_text(row['title'])
        print(f"Updating Title ID {row['id']}: '{row['title']}' -> '{new_title}'")
        supabase.table("titles").update({"title": new_title}).eq("id", row['id']).execute()

    # 2. Clean Chunks Table
    res = supabase.table("chunks").select("id, title").ilike("title", "%http%").execute()
    print(f"Found {len(res.data)} chunks to clean.")
    
    for row in res.data:
        new_title = clean_text(row['title'])
        supabase.table("chunks").update({"title": new_title}).eq("id", row['id']).execute()

    # 3. Clean Summaries Table
    res = supabase.table("summaries").select("id, title").ilike("title", "%http%").execute()
    print(f"Found {len(res.data)} summaries to clean.")
    
    for row in res.data:
        new_title = clean_text(row['title'])
        supabase.table("summaries").update({"title": new_title}).eq("id", row['id']).execute()

    print("Cleanup complete! 🧹📜✅")

if __name__ == "__main__":
    run_cleanup()
