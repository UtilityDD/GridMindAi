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
    # Match (https://...) or simply https://... until space or end
    # This is more aggressive to catch any URL pattern
    return re.sub(r'\(?https?://[^\s\)]+\)?', '', text).strip()

def process_table(table_name):
    print(f"--- Processing Table: {table_name} ---")
    # Fetch all records (assuming table size is manageable, < 5000)
    res = supabase.table(table_name).select("id, title").execute()
    count = 0
    for row in res.data:
        title = row['title']
        if not title: continue
        if "http" in title or "github" in title:
            new_title = clean_text(title)
            if new_title != title:
                print(f"Repairing {row['id']}: '{title}' -> '{new_title}'")
                supabase.table(table_name).update({"title": new_title}).eq("id", row['id']).execute()
                count += 1
    print(f"Repaired {count} rows in {table_name}.")

if __name__ == "__main__":
    for t in ["titles", "chunks", "summaries"]:
        process_table(t)
    print("Link Leak Cleanup Complete! 🧹📜✅")
