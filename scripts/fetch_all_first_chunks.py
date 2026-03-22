import os
import sys
import json
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
    
    # 1. Fetch Titles
    res = supabase.table('titles').select('doc_id, title').ilike('title', 'WBSEDCL Promotion Guidelines (%').execute()
    
    data = []
    for r in res.data:
        # Extract numeric index
        try:
            idx = int(r['title'].split('(')[1].split(')')[0])
        except:
            idx = 999
            
        # 2. Fetch First Chunk
        c = supabase.table('chunks').select('content').eq('doc_id', r['doc_id']).limit(1).execute()
        content = c.data[0]['content'] if c.data else 'No content'
        
        data.append({
            "idx": idx,
            "title": r['title'],
            "content_preview": content[:600].replace('\n', ' ')
        })
    
    # Sort by index
    data.sort(key=lambda x: x['idx'])
    
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    main()
