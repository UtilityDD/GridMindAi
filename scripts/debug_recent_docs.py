import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def check_recent():
    print("Fetching most recent chunks...")
    try:
        # Get last 10 chunks to see what was added last
        response = supabase.table("chunks").select("doc_id, title, ref, date, created_at").order("created_at", desc=True).limit(100).execute()
        data = response.data
        
        if not data:
            print("No chunks found in database.")
            return

        print(f"Total chunks found in selection: {len(data)}")
        seen_docs = set()
        for item in data:
            did = item['doc_id']
            if did not in seen_docs:
                title = item.get('title', 'Unknown')
                created = item.get('created_at', 'Unknown')
                ref = item.get('ref', 'Unknown')
                print(f"Latest Doc: {did} | Title: {title} | Ref: {ref} | Added At: {created}")
                seen_docs.add(did)
    except Exception as e:
        print(f"Error fetching chunks: {e}")

if __name__ == "__main__":
    check_recent()
