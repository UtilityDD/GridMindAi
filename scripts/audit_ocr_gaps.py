import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

def get_clean_name(filename):
    # Strip extension and common separators
    name = re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)
    return name.lower().strip()

def run_audit():
    print("🚀 Starting OCR Gap Audit...")
    
    # 1. Fetch DB Titles
    res = supabase.table('titles').select('title').execute()
    db_titles = [t['title'].lower() for t in res.data]
    print(f"Database contains {len(db_titles)} unique document titles.")

    # 2. Scan Local Folder
    ocr_path = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    local_files = [f for f in os.listdir(ocr_path) if f.lower().endswith('.pdf')]
    print(f"Found {len(local_files)} PDFs in local OCR folder.")

    pending = []
    found = []

    for file in local_files:
        clean = get_clean_name(file)
        
        # Look for the pattern (e.g. "IS 3043") inside the titles
        match = None
        for db_t in db_titles:
            # Check if filename is in DB title or vice versa
            if clean in db_t or db_t in clean:
                match = db_t
                break
            
            # Special check for "IS XXXX" or "ROPA XXXX"
            standard_match = re.search(r'(is\s*\d+|ropa\s*\d+|wberc\s*\d+)', clean)
            if standard_match:
                code = standard_match.group(1).replace(" ", "")
                if code in db_t.replace(" ", ""):
                    match = db_t
                    break

        if match:
            found.append((file, match))
        else:
            pending.append(file)

    print(f"\n✅ Found in DB ({len(found)}):")
    # print first 5 for verification
    for f, m in found[:5]:
        print(f" - {f} MATCHES '{m}'")

    print(f"\n❌ PENDING UPLOAD ({len(pending)}):")
    for p in pending:
        print(f" - {p}")

    print("\nAudit Complete! 🏁")

if __name__ == "__main__":
    run_audit()
