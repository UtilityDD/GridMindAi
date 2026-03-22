import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def main():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    supabase = create_client(url, key)
    
    print("Fetching master titles list...")
    # Fetch all doc_id and title from the 'titles' table (the source of truth)
    res = supabase.table('titles').select('doc_id, title').execute()
    titles_map = {r['doc_id']: r['title'] for r in res.data}
    
    print(f"Syncing {len(titles_map)} titles to chunks and summaries...")
    
    for doc_id, full_title in titles_map.items():
        # Update chunks table
        c_res = supabase.table('chunks').update({'title': full_title}).eq('doc_id', doc_id).execute()
        
        # Update summaries table
        s_res = supabase.table('summaries').update({'title': full_title}).eq('doc_id', doc_id).execute()
        
        # Small sanity check in logs every 20 docs
        if len(titles_map) % 20 == 0:
            print(f"Synced: {full_title}")
            
    print("Database synchronization complete! All tables now share the enriched titles.")

if __name__ == "__main__":
    main()
