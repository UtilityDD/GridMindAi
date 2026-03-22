import os
import sys
import json
import re
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def extract_subject(content):
    """Brain-Only extraction logic."""
    if not content: return ""
    
    # Clean up content
    content = content.replace('\n', ' ').strip()
    
    # Pattern 1: Sub: [Description]
    m = re.search(r"Sub:\s*([^.#\n]+)", content, re.IGNORECASE)
    if m: return m.group(1).strip()
    
    # Pattern 2: Subject: [Description]
    m = re.search(r"Subject:\s*([^.#\n]+)", content, re.IGNORECASE)
    if m: return m.group(1).strip()
    
    # Pattern 3: Part [X]: [Description] (for NBC)
    m = re.search(r"Part\s+(\d+|[A-Z]):\s*([^.]+)", content)
    if m: return f"Part {m.group(1)}: {m.group(2).strip()}"

    # Pattern 4: IS XXXX: (for Standards)
    m = re.search(r"(IS\s*\d+):\s*([^.]+)", content)
    if m: return f"{m.group(1)}: {m.group(2).strip()}"

    # Fallback: First sentence
    first_sent = re.split(r'[.!?]', content)[0]
    return first_sent[:60].strip() + "..."

def main():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    supabase = create_client(url, key)
    
    print("Fetching all titles...")
    res = supabase.table('titles').select('id, doc_id, title').execute()
    titles = res.data
    
    # 1. Enrichment Phase for generic titles
    print("Enriching generic titles...")
    for r in titles:
        t = r['title']
        # If generic (X) or has placeholders
        if ('(' in t and ')' in t and ' - ' not in t) or 'Subject' in t or '...' in t:
            c = supabase.table('chunks').select('content').eq('doc_id', r['doc_id']).limit(1).execute()
            if c.data:
                subject = extract_subject(c.data[0]['content'])
                if subject:
                    # Keep prefix, add subject
                    prefix = t.split(' - ')[0] if ' - ' in t else t
                    new_title = f"{prefix} - {subject}"
                    supabase.table('titles').update({'title': new_title}).eq('id', r['id']).execute()
                    r['title'] = new_title # Update local record for inventory
                    print(f"Updated: {new_title}")

    # 2. Inventory Generation Phase
    print("Generating DOCUMENT_INVENTORY.md...")
    final_titles = sorted([r['title'] for r in titles])
    
    inventory_path = PROJECT_ROOT / "DOCUMENT_INVENTORY.md"
    
    topics = [
        ("ROPA (Pay Revision)", ["ROPA"]),
        ("Promotion Guidelines", ["Promotion"]),
        ("Office Orders & Circulars", ["Office Order", "Circular"]),
        ("Technical Standards (IS Codes)", ["Standards", "IS "]),
        ("National Building Code (NBC)", ["NBC"]),
        ("Outsourcing (LT & HT)", ["Outsourcing"]),
        ("COVID-19 Circulars", ["COVID-19", "Pandemic"]),
        ("Safety & Welfare", ["Safety", "Welfare", "Medical"]),
        ("Other Policy Documents", []) # Catch-all
    ]
    
    used = set()
    with open(inventory_path, 'w', encoding='utf-8') as f:
        f.write("# GridMind AI - Document Inventory\n\n")
        f.write("A consolidated list of all ingested documents in the knowledge base, grouped by topic.\n")
        f.write(f"**Total Documents**: {len(final_titles)}\n\n")
        
        for label, keywords in topics:
            sub = []
            if not keywords: # Catch-all
                sub = [t for t in final_titles if t not in used]
            else:
                for t in final_titles:
                    if t not in used and any(k.lower() in t.lower() for k in keywords):
                        sub.append(t)
            
            if sub:
                f.write(f"## {label}\n")
                for i, t in enumerate(sorted(sub), 1):
                    f.write(f"{i}. {t}\n")
                    used.add(t)
                f.write("\n")
                
    print(f"Inventory saved to {inventory_path}")

if __name__ == "__main__":
    main()
