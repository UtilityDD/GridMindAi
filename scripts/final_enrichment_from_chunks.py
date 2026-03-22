import os
import sys
import logging
import json
import time
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

    # 2. Sequential Enrichment (Chunk based)
    results = []
    
    # We'll do batches of 5 to avoid 429 but keep speed reasonable
    for record in records:
        doc_id = record['doc_id']
        original_title = record['title']
        
        # Skip if already enriched (contains " - ")
        if " - " in original_title:
            continue
            
        # a. Fetch First Chunk
        res_chunk = supabase.table('chunks').select('content').eq('doc_id', doc_id).limit(1).execute()
        if not res_chunk.data:
            logger.warning(f"No chunks for {original_title}")
            continue
        
        chunk_content = res_chunk.data[0]['content']
        
        # b. Generate New Title (Patient Retry)
        max_llm_retries = len(config.GEMINI_KEY_POOL) * 2
        new_title = original_title
        
        prompt = f"""
        Document Chunk: {chunk_content[:1500]}
        
        Current Title: {original_title}
        
        TASK: Extract the specific subject of this WBSEDCL Promotion Guideline (e.g., "Promotion to SE" or "Service Conditions").
        
        Format: "{original_title} - [Short Descriptive Subject]"
        Return ONLY the final title string. Max 10 descriptive words.
        """
        
        for attempt in range(max_llm_retries):
            client = _get_client()
            try:
                response = client.models.generate_content(
                    model=config.GEMINI_LLM_MODEL,
                    contents=prompt
                )
                cand = response.text.strip().replace('"', '')
                if cand and " - " in cand:
                    new_title = cand
                    break
            except Exception as e:
                if "429" in str(e):
                    logger.warning(f"Rate limit hit for {original_title}. Rotating... ({attempt+1})")
                    time.sleep(10)
                    continue
                logger.error(f"LLM fail for {original_title}: {e}")
                break
                
        if new_title != original_title:
            # c. Update and Embed
            title_text = f"{new_title} | Keywords: Finance, Promotion, Guidelines, WBSEDCL"
            title_embedding = embed_single(title_text)
            
            supabase.table('titles').update({
                'title': new_title,
                'embedding': title_embedding
            }).eq('doc_id', doc_id).execute()
            
            logger.info(f"Updated: {original_title} -> {new_title}")
            results.append(f"{original_title} -> {new_title}")
            time.sleep(1) # Small gap
        else:
            logger.info(f"Skipped {original_title}")

    # Final summary
    print("\n" + "="*50)
    print("CHUNK-BASED ENRICHMENT SUMMARY")
    print("="*50)
    for r in results:
        print(r)

if __name__ == "__main__":
    main()
