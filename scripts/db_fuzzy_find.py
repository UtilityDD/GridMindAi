import os
import re
import itertools
from difflib import SequenceMatcher
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def normalize_title(title: str) -> str:
    if not title: return ""
    clean = re.sub(r'[^\w\s]', '', title.lower())
    return re.sub(r'\s+', ' ', clean).strip()

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()

def find_fuzzy_duplicates(threshold=0.85):
    print(f"Fetching document metadata... (Scanning for Title Similarity > {threshold*100}%)")
    res = supabase.table("chunks").select("doc_id, title").execute()
    
    if not res.data:
        print("No data found in 'chunks' table.")
        return

    # Extract unique docs
    unique_docs = {}
    for row in res.data:
        did = row['doc_id']
        title = row.get('title', 'Unknown')
        if did not in unique_docs:
            unique_docs[did] = {'raw': title, 'norm': normalize_title(title)}

    print(f"Analyzing {len(unique_docs)} unique documents...")
    
    # O(N^2) comparison
    doc_list = list(unique_docs.items()) # list of (doc_id, dict)
    fuzzy_matches = []

    for i in range(len(doc_list)):
        for j in range(i + 1, len(doc_list)):
            id1, val1 = doc_list[i]
            id2, val2 = doc_list[j]
            
            # If norm titles are literally identical, we already caught them in script 1
            if val1['norm'] == val2['norm']:
                continue
                
            sim = similarity(val1['norm'], val2['norm'])
            if sim >= threshold:
                fuzzy_matches.append((sim, id1, val1['raw'], id2, val2['raw']))

    # Sort matches by highest similarity first
    fuzzy_matches.sort(key=lambda x: x[0], reverse=True)

    with open("fuzzy_report.txt", "w", encoding="utf-8") as rep:
        if not fuzzy_matches:
            msg = "✅ No structurally similar/fuzzy duplicates found!"
            print(msg)
            rep.write(msg)
            return

        header = f"⚠️ Found {len(fuzzy_matches)} pairs of fuzzy duplicates (names are very similar but not identical):\n\n"
        print(header, end="")
        rep.write(header)

        for match in fuzzy_matches:
            sim, id1, raw1, id2, raw2 = match
            sim_pct = round(sim * 100, 1)
            msg =  f"[SIMILARITY: {sim_pct}%]\n"
            msg += f"   A. doc_id: {id1} | title: '{raw1}'\n"
            msg += f"   B. doc_id: {id2} | title: '{raw2}'\n"
            msg += "-" * 60 + "\n"
            print(msg, end="")
            rep.write(msg)
            
    print("\nReport saved to: scripts/fuzzy_report.txt")

if __name__ == "__main__":
    # You can tweak the threshold (e.g. 0.80 for 80% match) to cast a wider net
    find_fuzzy_duplicates(threshold=0.85)
