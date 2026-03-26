import os
import sys
import requests
from pathlib import Path
from urllib.parse import urlparse, unquote

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from supabase import create_client
from dotenv import load_dotenv

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

def sanitize_filename(filename):
    # Remove invalid characters for Windows
    invalid = '<>:"/\\|?*'
    for char in invalid:
        filename = filename.replace(char, '_')
    return filename

def download_file(url, target_folder):
    try:
        # Extract filename from URL
        parsed_url = urlparse(url)
        filename = os.path.basename(unquote(parsed_url.path))
        
        if not filename or '.' not in filename:
            # If no filename in URL, use a hash or title?
            # For now, let's try to get it from headers or use a fallback
            filename = f"downloaded_asset_{hash(url)}.pdf"

        filename = sanitize_filename(filename)
        target_path = os.path.join(target_folder, filename)

        if os.path.exists(target_path):
            logger.info(f"Skipping (already exists): {filename}")
            return True

        logger.info(f"Downloading: {url} -> {filename}")
        r = requests.get(url, stream=True, timeout=30)
        r.raise_for_status()

        with open(target_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")
        return False

def main():
    load_dotenv()
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
    supabase = create_client(supabase_url, supabase_key)

    # 1. Setup Target Folder
    target_folder = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\External_Downloads"
    os.makedirs(target_folder, exist_ok=True)

    # 2. Fetch all source_urls
    logger.info("Fetching all source_urls from Supabase...")
    # Using a broad select to find all non-github links
    res = supabase.table('titles').select('source_url').execute()
    
    unique_urls = set()
    for row in res.data:
        url = row.get('source_url')
        if url and 'github.com' not in url.lower():
            unique_urls.add(url)

    logger.info(f"Found {len(unique_urls)} non-GitHub unique URLs.")

    # 3. Download
    success_count = 0
    for url in unique_urls:
        if download_file(url, target_folder):
            success_count += 1

    logger.info(f"Localization complete. Successfully downloaded {success_count} / {len(unique_urls)} assets.")
    print(f"\n--- MISSION COMPLETE ---\nFolder: {target_folder}\nTotal: {len(unique_urls)}\nSuccess: {success_count}")

if __name__ == "__main__":
    main()
