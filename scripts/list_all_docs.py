import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def list_docs():
    # Fetch some chunks and their metadata to identify docs
    # Using small limit to avoid massive data transfer but large enough to see unique doc_ids
    response = supabase.table("chunks").select("doc_id, metadata").limit(5000).execute()
    data = response.data
    
    docs = {}
    for item in data:
        did = item['doc_id']
        title = item.get('metadata', {}).get('title', 'Unknown')
        if did not in docs:
            docs[did] = {'count': 0, 'title': title}
        docs[did]['count'] += 1
    
    print("Ingested Documents (Snapshot):")
    for did, info in docs.items():
        print(f"ID: {did} | Chunks: {info['count']} | Title: {info['title']}")

if __name__ == "__main__":
    list_docs()
