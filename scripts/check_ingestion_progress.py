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
        {"ref": "IS 3043:1987", "name": "Earthing", "total": 138},
        {"ref": "NBC 2005 Group 4", "name": "NBC Light/Vent", "total": 1000},
    ]
    
    print("-" * 65)
    print(f"{'Standard Ref':<20} | {'Status':<15} | {'Chunks':<8} / {'Total':<6}")
    print("-" * 65)
    
    for doc in target_docs:
        res = client.table("chunks").select("id", count="exact").eq("ref", doc["ref"]).execute()
        count = res.count if hasattr(res, 'count') else len(res.data)
        
        status = "COMPLETED" if count >= doc["total"] else "IN PROGRESS"
        if count == 0: status = "PENDING"
        
        print(f"{doc['ref']:<20} | {status:<15} | {count:<8} / {doc['total']:<6}")
    print("-" * 65)

if __name__ == "__main__":
    main()
