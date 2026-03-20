import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.supabase_writer import _get_client

def main():
    client = _get_client()
    
    target_docs = [
        {"ref": "IS 5613-1-1:1985", "name": "OH Line 11KV Sec-1", "total": 16},
        {"ref": "IS 1678:1998", "name": "PCC Pole", "total": 44},
        {"ref": "IS 808:1989", "name": "Steel Sections", "total": 7}
    ]
    
    print("-" * 60)
    print(f"{'Standard Ref':<20} | {'Status':<15} | {'Chunks Done':<12} / {'Approx':<6}")
    print("-" * 60)
    
    for doc in target_docs:
        res = client.table("chunks").select("id", count="exact").eq("ref", doc["ref"]).execute()
        count = res.count if hasattr(res, 'count') else len(res.data)
        
        status = "COMPLETED" if count >= doc["total"] else "IN PROGRESS"
        if count == 0: status = "PENDING"
        
        print(f"{doc['ref']:<20} | {status:<15} | {count:<12} / {doc['total']:<6}")
    print("-" * 60)

if __name__ == "__main__":
    main()
