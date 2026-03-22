import os
import sys
import logging
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from pipeline.summarize import _get_client
from pipeline.embed import embed_single
from supabase import create_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(supabase_url, supabase_key)

    # 1. Fetch all Promotion Guidelines records
    res_titles = supabase.table('titles').select('doc_id, title').ilike('title', 'WBSEDCL Promotion Guidelines (%').execute()
    records = res_titles.data
    
    if not records:
        logger.warning("No records found.")
        return

    # Sort records by their numeric index
    def sort_index(r):
        try:
            return int(r['title'].split('(')[1].split(')')[0])
        except:
            return 999
    records.sort(key=sort_index)

    # 2. Fetch all Summaries in batch
    doc_ids = [r['doc_id'] for r in records]
    res_sums = supabase.table('summaries').select('doc_id, summary_text').in_('doc_id', doc_ids).execute()
    sum_map = {s['doc_id']: s['summary_text'] for s in res_sums.data}

    # 3. Build Batch Prompt
    context_list = []
    for r in records:
        summary = sum_map.get(r['doc_id'], "No summary available")
        context_list.append(f"Doc Index: {r['title']}\nSummary: {summary[:500]}...") # Limit summary size for context window

    batch_context = "\n\n".join(context_list)
    
    prompt = f"""
    You are an expert HR and Finance analyst for WBSEDCL.
    I have a series of 31 Promotion Guideline documents with generic titles.
    I need you to generate a descriptive subject for each one based on its summary.
    
    GUIDELINES:
    - Keep the original prefix: "WBSEDCL Promotion Guidelines (X)"
    - Add a descriptive subject: " - [Description]"
    - Focus on the post, rank, or specific criteria (e.g., "Criteria for Promotion to Accountant" or "Reservation Policy").
    - Be concise (max 10 words per description).
    
    DATA:
    {batch_context}
    
    OUTPUT FORMAT:
    Provide the output as a JSON list of strings, in order.
    Example: ["WBSEDCL Promotion Guidelines (1) - General Conditions", "WBSEDCL Promotion Guidelines (2) - Promotion to SE"]
    """

    # 4. Single LLM Call
    client = _get_client()
    try:
        logger.info("Sending batch request to Gemini...")
        response = client.models.generate_content(
            model=config.GEMINI_LLM_MODEL,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        new_titles = json.loads(response.text)
        logger.info(f"Received {len(new_titles)} titles from Gemini.")
    except Exception as e:
        logger.error(f"Batch LLM call failed: {e}")
        return

    # 5. Apply Updates sequentially (Supabase is fast, no 429 there usually)
    results = []
    for i, record in enumerate(records):
        if i >= len(new_titles):
            break
            
        doc_id = record['doc_id']
        old_title = record['title']
        new_title = new_titles[i]
        
        if new_title == old_title:
            continue

        # Re-Embed
        title_text = f"{new_title} | Keywords: Finance, Promotion, Guidelines, WBSEDCL"
        title_embedding = embed_single(title_text)
        
        supabase.table('titles').update({
            'title': new_title,
            'embedding': title_embedding
        }).eq('doc_id', doc_id).execute()
        
        logger.info(f"Updated: {old_title} -> {new_title}")
        results.append(f"{old_title} -> {new_title}")

    # Final summary for logs
    print("\n" + "="*50)
    print("BATCH ENRICHMENT SUMMARY")
    print("="*50)
    for r in results:
        print(r)

if __name__ == "__main__":
    main()
