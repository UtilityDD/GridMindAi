import os
import re
from collections import defaultdict
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def normalize_title(title: str) -> str:
    """Removes special characters, extra spaces, and lowercases for duplicate detection."""
    if not title: return ""
    # Remove everything except letters and numbers
    clean = re.sub(r'[^\w\s]', '', title.lower())
    # Collapse multiple spaces
    return re.sub(r'\s+', ' ', clean).strip()

def find_and_clean_duplicates(dry_run=True):
    print("Fetching document metadata...")
    
    # We fetch a large chunk set just to extract unique doc_ids and titles
    res = supabase.table("chunks").select("doc_id, title").execute()
    
    if not res.data:
        print("No data found in 'chunks' table.")
        return

    # Map doc_id -> raw title
    doc_map = {}
    for row in res.data:
        did = row['doc_id']
        if did not in doc_map:
            title = row.get('title', 'Unknown')
            doc_map[did] = title

    print(f"Total Unique Doc IDs found: {len(doc_map)}")

    # Group doc_ids by Normalized Title
    grouped = defaultdict(list)
    for did, raw_title in doc_map.items():
        norm = normalize_title(raw_title)
        grouped[norm].append({'doc_id': did, 'raw_title': raw_title})

    # Find groups with more than 1 document
    duplicates = {k: v for k, v in grouped.items() if len(v) > 1}
    
    if not duplicates:
        print("✅ No duplicates found based on normalized titles!")
        return

    print(f"\n⚠️ Found {len(duplicates)} documents that have been ingested multiple times:\n")
    
    total_deletes = 0

    with open("duplicate_report.txt", "w", encoding="utf-8") as rep:
        for norm_title, docs in duplicates.items():
            msg = f"[{norm_title.upper()}] has {len(docs)} versions:\n"
            print(msg, end="")
            rep.write(msg)
            for idx, d in enumerate(docs):
                item_msg = f"   {idx+1}. doc_id: {d['doc_id']} | raw_title: {d['raw_title']}\n"
                print(item_msg, end="")
                rep.write(item_msg)
            
            # Keep the first one, delete the rest
            docs_to_delete = docs[1:]
            
            for d in docs_to_delete:
                did = d['doc_id']
                if dry_run:
                    dry_msg = f"   -> [DRY RUN] Would delete doc_id: {did}\n"
                    print(dry_msg, end="")
                    rep.write(dry_msg)
                else:
                    print(f"   -> [EXECUTING] Deleting doc_id: {did} across all tables...")
                    try:
                        # Supabase automatically cascades if relations are set, 
                        # but safety first, let's delete explicitly across known tables
                        supabase.table("chunks").delete().eq("doc_id", did).execute()
                        supabase.table("summaries").delete().eq("doc_id", did).execute()
                        supabase.table("titles").delete().eq("doc_id", did).execute()
                        total_deletes += 1
                    except Exception as e:
                        print(f"      ERROR removing {did}: {e}")
            print("-" * 50)

    if dry_run:
        print("\n🔵 DRY RUN COMPLETE. No data was destroyed.")
        print("To actually delete these duplicates, change `dry_run=False` in the script.")
    else:
        print(f"\n🔴 CLEANUP COMPLETE. Successfully deleted {total_deletes} duplicate documents.")

if __name__ == "__main__":
    # Start with dry_run=True to physically preview what will be shredded
    find_and_clean_duplicates(dry_run=True)
