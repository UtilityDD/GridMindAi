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
    
    res = supabase.table('summaries').select('title, summary_text').ilike('title', 'WBSEDCL Promotion Guidelines (%').execute()
    
    output = []
    for r in res.data:
        output.append({
            "title": r['title'],
            "summary": r['summary_text'][:300] # Enough to understand the subject
        })
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
