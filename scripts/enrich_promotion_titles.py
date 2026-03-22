import os
import sys
import logging
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

def generate_descriptive_title(original_title, content_summary):
    """Uses LLM to generate a descriptive title based on summary with patient retries."""
    max_retries = len(config.GEMINI_KEY_POOL) * 3
    
    prompt = f"""
    The following is a summary of a WBSEDCL Promotion Guideline document.
    Current Title: {original_title}
    Summary: {content_summary}
    
    TASK: Generate a DESCRIPTIVE title that captures the specific subject of this document. 
    Focus on the post/rank or specific criteria mentioned (e.g., "Criteria for Promotion to Office Superintendent" or "Service Conditions").
    
    Format: "{original_title} - [Short Descriptive Subject]"
    Example: "WBSEDCL Promotion Guidelines (3) - Criteria for Promotion to Superintending Engineer"
    
    Keep the descriptive part concise (max 10 words).
    Return ONLY the final title string.
    """
    
    for attempt in range(max_retries):
        client = _get_client()
        try:
            response = client.models.generate_content(
                model=config.GEMINI_LLM_MODEL,
                contents=prompt,
            )
            new_title = response.text.strip().replace('"', '')
            return new_title
        except Exception as exc:
            msg = str(exc)
            if ("429" in msg or "RESOURCE_EXHAUSTED" in msg) and attempt < max_retries - 1:
                logger.warning("Rate limit hit. Sleeping 10s... (Attempt %d/%d)", attempt + 1, max_retries)
                time.sleep(10)
                continue
            logger.error(f"Failed to generate title for {original_title}: {msg[:100]}")
            break
            
    return original_title

def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(supabase_url, supabase_key)

    res = supabase.table('titles').select('doc_id, title').ilike('title', 'WBSEDCL Promotion Guidelines (%').execute()
    records = res.data
    
    if not records:
        logger.warning("No records found.")
        return

    # Sort records by their numeric index for logical sequential processing
    def sort_key(r):
        try:
            return int(r['title'].split('(')[1].split(')')[0])
        except:
            return 999
    records.sort(key=sort_key)

    logger.info(f"Enriching {len(records)} records SEQUENTIALLY...")

    results = []
    for rec in records:
        doc_id = rec['doc_id']
        original_title = rec['title']
        
        # 1. Fetch Summary
        res_sum = supabase.table('summaries').select('summary_text').eq('doc_id', doc_id).single().execute()
        if not res_sum.data:
            logger.warning(f"No summary for {original_title}")
            continue
        
        summary_content = res_sum.data['summary_text']
        
        # 2. Generate New Title
        new_title = generate_descriptive_title(original_title, summary_content)
        
        if new_title != original_title:
            # 3. Update Title and Re-Embed
            title_text = f"{new_title} | Keywords: Finance, Promotion, Guidelines, WBSEDCL"
            title_embedding = embed_single(title_text)
            
            res_update = supabase.table('titles').update({
                'title': new_title,
                'embedding': title_embedding
            }).eq('doc_id', doc_id).execute()
            
            logger.info(f"Updated: {original_title} -> {new_title}")
            results.append(f"{original_title} -> {new_title}")
            time.sleep(2) # Small gap between requests for stability
        else:
            logger.info(f"Skipped {original_title}")

    # Final summary for logs
    print("\n" + "="*50)
    print("FINAL ENRICHMENT SUMMARY")
    print("="*50)
    for r in results:
        print(r)

if __name__ == "__main__":
    main()
