import os
import hashlib
import logging
from pathlib import Path
from urllib.parse import quote

# Import gridmind pipeline components
import config
from pipeline.chunk import chunk_text
from pipeline.embed import embed_texts, embed_single
from pipeline.supabase_writer import upsert_chunks, upsert_title

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Ensure we use ONLY the paid key if requested
# We override the pool to contain ONLY the primary GEMINI_API_KEY
if config.GEMINI_API_KEY:
    config.GEMINI_KEY_POOL = [config.GEMINI_API_KEY]
    logger.info("Configuring script to use strictly the primary GEMINI_API_KEY (Paid Tier).")
else:
    logger.warning("GEMINI_API_KEY not found in .env! Using existing config defaults.")

def generate_doc_id(filename: str) -> str:
    """Generate a stable 16-char doc_id for each file."""
    return hashlib.sha256(filename.encode()).hexdigest()[:16]

def ingest_labour_laws():
    # Source and Output Paths
    source_dir = Path(r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\Labour Laws\Markdown Files")
    base_github_url = "https://github.com/smartlinemanapp/GridMind/blob/main/"
    
    if not source_dir.exists():
        logger.error(f"Source directory not found: {source_dir}")
        return

    md_files = list(source_dir.glob("*.md"))
    logger.info(f"Found {len(md_files)} Markdown files for ingestion.")

    for md_file in md_files:
        title = md_file.stem
        # URL encode the filename for the GitHub link
        # The user said 'same name as md' but linked to .pdf
        pdf_filename = f"{title}.pdf"
        source_url = f"{base_github_url}{quote(pdf_filename)}"
        
        doc_id = generate_doc_id(title)
        
        logger.info(f"Ingesting: {title} (ID: {doc_id})")
        
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            if not content.strip():
                logger.warning(f"Empty file: {md_file.name}, skipping.")
                continue

            metadata = {
                "ref": "Labour Law",
                "date": "2026", # Latest regulatory batch
                "title": title,
                "source_url": source_url
            }

            # 1. Chunking
            chunks = chunk_text(content)
            logger.info(f"Created {len(chunks)} chunks.")

            # 2. Embedding
            logger.info("Generating embeddings...")
            # Use GEMINI_PAID_KEY if available, else standard
            key = config.GEMINI_PAID_KEY or config.GEMINI_API_KEY
            # Note: embed_texts and embed_single use config.GEMINI_API_KEY internally, 
            # so we ensure it's set correctly in the environment or config.
            
            chunk_embeddings = embed_texts(chunks)
            title_embedding = embed_single(title)

            # 3. Supabase Upsert
            logger.info("Pushing to Supabase...")
            upsert_chunks(doc_id, chunks, chunk_embeddings, metadata)
            upsert_title(doc_id, title, title_embedding, metadata)
            
            logger.info(f"Successfully integrated: {title}")

        except Exception as e:
            logger.exception(f"Failed to ingest {md_file.name}: {e}")

if __name__ == "__main__":
    ingest_labour_laws()
