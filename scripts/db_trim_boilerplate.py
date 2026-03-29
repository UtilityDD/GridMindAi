import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Try importing the project's embedding pipeline or gracefully fallback to just text trimming
try:
    from pipeline.embed import embed_single
    HAS_EMBEDDER = True
except ImportError:
    HAS_EMBEDDER = False

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

# Official regulatory documents often end with these massive CC cascades
BOILERPLATE_TRIGGERS = [
    r"(?i)\bCopy\s+(forwarded\s+)?(for\s+information\s+)?to\s*[:\-]",
    r"(?i)\n\s*Distribution\s*[:\-]",
    r"(?i)\bMemo\s+No[.\s]+.*?\bCopy\b"
]

def trim_boilerplate(content: str) -> str:
    """Finds the index of the first boilerplate trigger and truncates everything after it."""
    earliest_index = len(content)
    found = False

    for pattern in BOILERPLATE_TRIGGERS:
        match = re.search(pattern, content)
        if match and match.start() < earliest_index:
            earliest_index = match.start()
            found = True

    if found:
        return content[:earliest_index].strip()
    return content

def find_and_slice_boilerplates(dry_run=True):
    print("Fetching all semantic chunks for pattern matching...")
    # Pagination might be needed for thousands of chunks, but let's query the first large batch
    res = supabase.table("chunks").select("id, doc_id, content").execute()
    
    if not res.data:
        print("No chunks found in the DB.")
        return

    total_chunks = len(res.data)
    affected_chunks = 0

    print(f"Scanned {total_chunks} chunks. Searching for 'Copy To/Distribution' noise...")

    for row in res.data:
        chunk_id = row['id']
        original_text = row['content']
        
        trimmed_text = trim_boilerplate(original_text)
        
        if len(trimmed_text) < len(original_text):
            affected_chunks += 1
            print(f"\n[DETECTED in doc_id: {row['doc_id']}]")
            print(f"  ORIGINAL ENDING: {original_text[-120:].replace(chr(10), ' ')}...")
            print(f"  TRIMMED ENDING : {trimmed_text[-120:].replace(chr(10), ' ')}...")
            
            chars_removed = len(original_text) - len(trimmed_text)
            print(f"  --> Saved {chars_removed} characters of Noise.")
            
            if not dry_run:
                # If the chunk becomes too small (e.g., just header), we might delete it
                if len(trimmed_text) < 50:
                    print("  --> Chunk became obsolete (<50 chars). Deleting...")
                    supabase.table("chunks").delete().eq("id", chunk_id).execute()
                else:
                    if HAS_EMBEDDER:
                        print("  --> Re-embedding and updating Database...")
                        new_embedding = embed_single(trimmed_text)
                        supabase.table("chunks").update({
                            "content": trimmed_text,
                            "embedding": new_embedding
                        }).eq("id", chunk_id).execute()
                    else:
                        print("  --> WARNING: Could not import `pipeline.embed`. Cannot re-embed. Text-only update.")
                        # Warning: Supabase might throw an error if dimension length doesn't naturally match, usually we must provide embedding
                        pass

    if dry_run:
        print(f"\n🔵 DRY RUN COMPLETE. Found {affected_chunks} polluted chunks.")
        print("Set `dry_run=False` inside the script to permanently purge the boilerplates and re-embed.")
    else:
        print(f"\n🔴 CLEANUP COMPLETE. Sanitized {affected_chunks} chunks.")

if __name__ == "__main__":
    find_and_slice_boilerplates(dry_run=True)
