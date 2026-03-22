import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# We'll fetch the data and update dynamically using my "brain" logic inside the script
# for the last 52 records found in the discovery phase.

def main():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    supabase = create_client(url, key)
    
    # Discovery: Find all titles with (X) but no " - "
    res = supabase.table('titles').select('id, doc_id, title').execute()
    
    for r in res.data:
        title = r['title']
        if '(' in title and ')' in title and ' - ' not in title:
            # Fetch Chunk to identify subject
            c = supabase.table('chunks').select('content').eq('doc_id', r['doc_id']).limit(1).execute()
            if not c.data:
                continue
                
            content = c.data[0]['content']
            subject = ""
            
            # Brain Logic for Dynamic Renaming
            if "NBC 2005" in title:
                # Look for "Part X:" or "Part 0:"
                import re
                m = re.search(r"Part\s+(\d+|[A-Z]):\s*([^.]+)", content)
                if m: subject = f"Part {m.group(1)}: {m.group(2).strip()}"
            elif "Standards" in title:
                # Look for IS XXXX:
                import re
                m = re.search(r"(IS\s*\d+):\s*([^.]+)", content)
                if m: subject = f"{m.group(1)}: {m.group(2).strip()}"
            elif "Electricity Rules" in title:
                # Look for Chapter X:
                import re
                m = re.search(r"Chapter\s+([IXVLM]+):\s*([^.]+)", content)
                if m: subject = f"Chapter {m.group(1)}: {m.group(2).strip()}"
            
            if not subject:
                # Fallback to a generic concise phrase from the first sentence
                import re
                first_sent = re.split(r'[.!?]', content)[0]
                # Cleanup
                subject = first_sent[:40].strip() + "..."
            
            new_title = f"{title} - {subject}"
            supabase.table('titles').update({'title': new_title}).eq('id', r['id']).execute()
            print(f"Enriched: {title} -> {new_title}")

if __name__ == "__main__":
    main()
