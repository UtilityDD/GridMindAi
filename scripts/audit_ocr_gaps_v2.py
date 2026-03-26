import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

def get_clean_name(filename):
    name = re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)
    return name.lower().strip()

def run_audit():
    print("🚀 Starting Paginated Deep Audit...")
    
    # 1. Fetch ALL DB Titles (Paginated)
    db_titles = []
    page_size = 1000
    start = 0
    while True:
        res = supabase.table('titles').select('title').range(start, start + page_size - 1).execute()
        if not res.data: break
        db_titles.extend([t['title'].lower() for t in res.data])
        if len(res.data) < page_size: break
        start += page_size
    
    print(f"Database contains {len(db_titles)} total document titles.")

    # 2. Scan Local Folder
    ocr_path = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    local_files = [f for f in os.listdir(ocr_path) if f.lower().endswith('.pdf')]
    print(f"Found {len(local_files)} PDFs in local folder.")

    pending = []
    found = []

    for file in local_files:
        clean = get_clean_name(file)
        match = None
        
        # Check against every DB title
        for db_t in db_titles:
            # Flexible Match 1: Substring
            if clean in db_t or db_t in clean:
                match = db_t
                break
            
            # Flexible Match 2: Code stripping (IS 3043 -> is3043)
            clean_token = re.sub(r'[^a-z0-9]', '', clean)
            db_token = re.sub(r'[^a-z0-9]', '', db_t)
            if clean_token and clean_token in db_token:
                match = db_t
                break

        if match:
            found.append((file, match))
        else:
            pending.append(file)

    print(f"\n✅ ALREADY UPLOADED ({len(found)}):")
    # Show first 5 for proof
    for f, m in found[:5]:
        print(f" - {f} -> '{m}'")

    print(f"\n❌ PENDING UPLOAD ({len(pending)}):")
    for p in pending:
        print(f" - {p}")

    print("\nAudit Complete! 🏁")

if __name__ == "__main__":
    run_audit()
