import json
import os
import requests
import re
from pathlib import Path

# Configuration
JSON_PATH = Path("wberc_discovered_links.json")
DOWNLOAD_DIR = Path(r"D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind")

def sanitize_filename(filename):
    # Remove characters that are illegal in Windows filenames
    return re.sub(r'[<>:"/\\|?*]', '_', filename)

def download_pdfs():
    # Ensure directory exists
    if not DOWNLOAD_DIR.exists():
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        print(f"Created directory: {DOWNLOAD_DIR}")

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        links = json.load(f)

    print(f"Starting download of {len(links)} files...")
    
    success_count = 0
    fail_count = 0

    for i, item in enumerate(links):
        title = item['title']
        url = item['url']
        
        # Create a safe filename
        safe_title = sanitize_filename(title)
        if not safe_title.lower().endswith(".pdf"):
            safe_title += ".pdf"
            
        dest_path = DOWNLOAD_DIR / safe_title
        
        print(f"[{i+1}/{len(links)}] Downloading: {title}")
        
        try:
            response = requests.get(url, timeout=60, stream=True)
            response.raise_for_status()
            
            with open(dest_path, "wb") as pdf_file:
                for chunk in response.iter_content(chunk_size=8192):
                    pdf_file.write(chunk)
            
            print(f"    Saved as: {safe_title}")
            success_count += 1
        except Exception as e:
            print(f"    FAILED to download {title}: {e}")
            fail_count += 1

    print("\n" + "="*30)
    print(f"Download complete!")
    print(f"Successfully downloaded: {success_count}")
    print(f"Failed: {fail_count}")
    print(f"Files are in: {DOWNLOAD_DIR}")
    print("="*30)

if __name__ == "__main__":
    download_pdfs()
