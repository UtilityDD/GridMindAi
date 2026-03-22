import os
import sys
import logging
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from supabase import create_client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

def main():
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(url, key)

    # 1. Fetch titles with .md links
    res = supabase.table("titles").select("id, doc_id, source_url").ilike("source_url", "%Covid19_Circulars%md").execute()
    
    affected_titles = res.data
    logger.info(f"Found {len(affected_titles)} titles to fix.")

    for item in affected_titles:
        old_url = item["source_url"]
        doc_id = item["doc_id"]
        title_id = item["id"]
        
        # Replace .md with .pdf (only at the end to be safe)
        if old_url.endswith(".md"):
            new_url = old_url[:-3] + ".pdf"
        else:
            new_url = old_url.replace(".md", ".pdf")
            
        logger.info(f"Fixing doc_id={doc_id}: {old_url} -> {new_url}")

        # Update Titles
        supabase.table("titles").update({"source_url": new_url}).eq("id", title_id).execute()
        
        # Update Summaries
        supabase.table("summaries").update({"source_url": new_url}).eq("doc_id", doc_id).execute()
        
        # Update Chunks
        supabase.table("chunks").update({"source_url": new_url}).eq("doc_id", doc_id).execute()

    logger.info("Correction completed successfully.")

if __name__ == "__main__":
    main()
