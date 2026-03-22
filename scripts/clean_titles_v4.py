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
    return re.sub(r'\(?https?://[^\s\)]+\)?', '', text).strip()

def process_table_paginated(table_name):
    print(f"--- Deep Sweep: {table_name} ---")
    page_size = 1000
    start = 0
    total_repaired = 0
    
    while True:
        end = start + page_size - 1
        res = supabase.table(table_name).select("id, title").range(start, end).execute()
        
        if not res.data:
            break
            
        for row in res.data:
            title = row['title']
            if not title: continue
            if "http" in title or "github" in title:
                new_title = clean_text(title)
                if new_title != title:
                    print(f"Repairing {row['id']}: '{title}' -> '{new_title}'")
                    supabase.table(table_name).update({"title": new_title}).eq("id", row['id']).execute()
                    total_repaired += 1
        
        if len(res.data) < page_size:
            break
        start += page_size

    print(f"Finished {table_name}. Total repaired: {total_repaired}")

if __name__ == "__main__":
    for t in ["titles", "chunks", "summaries"]:
        process_table_paginated(t)
    print("Deep Sweep Complete! 🧹📜✅")
