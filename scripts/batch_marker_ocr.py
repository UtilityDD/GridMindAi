import os
import shutil
import subprocess
import re
import time
from pathlib import Path

# --- CONFIGURATION ---
SOURCE_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Pdf"
OUTPUT_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Md"
MARKER_PATH = r"C:\Users\dipnk\AppData\Roaming\Python\Python313\Scripts\marker_single.exe"

def sanitize_filename(filename):
    """Sanitize filename to avoid Windows/Marker path issues."""
    # Keep the extension separate
    base, ext = os.path.splitext(filename)
    # Replace dots (except before extension), spaces, and special chars with underscores
    clean_base = re.sub(r'[^a-zA-Z0-9]', '_', base)
    # Collapse multiple underscores
    clean_base = re.sub(r'_+', '_', clean_base).strip('_')
    return clean_base + ext

def run_batch_ocr():
    print(f"🚀 Starting Resilient Batch OCR (Marker-PDF Engine)")
    print(f"📁 Source: {SOURCE_DIR}")
    print(f"📁 Target: {OUTPUT_DIR}")
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Get all PDFs
    all_pdfs = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith('.pdf')]
    print(f"📝 Found {len(all_pdfs)} files in queue.")

    for i, pdf_name in enumerate(all_pdfs):
        print(f"\n[{i+1}/{len(all_pdfs)}] Processing: {pdf_name}")
        
        # 1. Check for resumption
        # Marker creates a folder with the same name as the input (minus extension)
        # We need to check if the Markdown file exists inside that folder
        clean_name = sanitize_filename(pdf_name)
        folder_name = os.path.splitext(clean_name)[0]
        final_md_path = os.path.join(OUTPUT_DIR, folder_name, f"{folder_name}.md")
        
        if os.path.exists(final_md_path):
            print(f"⏭️ Skipping (Already exists: {folder_name})")
            continue

        # 2. Prepare Temporary Path
        # We use a temp name to avoid the "with open" long filename error
        temp_pdf_name = f"proc_{i:03d}.pdf"
        temp_pdf_path = os.path.join(SOURCE_DIR, temp_pdf_name)
        original_pdf_path = os.path.join(SOURCE_DIR, pdf_name)
        
        try:
            # Copy to temp short name
            shutil.copy2(original_pdf_path, temp_pdf_path)
            
            # 3. Invoke Marker
            # marker_single <fpath> --output_dir <dout>
            cmd = [
                MARKER_PATH,
                temp_pdf_path,
                "--output_dir", OUTPUT_DIR
            ]
            
            start_time = time.time()
            process = subprocess.run(cmd, capture_output=True, text=True)
            elapsed = time.time() - start_time
            
            if process.returncode == 0:
                # 4. Success -> Rename the output folder to the sanitized original name
                temp_folder_name = f"proc_{i:03d}"
                temp_folder_path = os.path.join(OUTPUT_DIR, temp_folder_name)
                final_folder_path = os.path.join(OUTPUT_DIR, folder_name)
                
                if os.path.exists(temp_folder_path):
                    if os.path.exists(final_folder_path):
                        shutil.rmtree(final_folder_path) # Clear old if exists
                    os.rename(temp_folder_path, final_folder_path)
                    
                    # Also rename the .md file inside to match
                    old_md_file = os.path.join(final_folder_path, f"{temp_folder_name}.md")
                    new_md_file = os.path.join(final_folder_path, f"{folder_name}.md")
                    if os.path.exists(old_md_file):
                        os.rename(old_md_file, new_md_file)
                        
                print(f"✅ Success! ({elapsed:.1f}s) -> {folder_name}")
            else:
                print(f"❌ Failed: {pdf_name}")
                print(f"Error: {process.stderr[:500]}")
                
        except Exception as e:
            print(f"⚠️ Error processing {pdf_name}: {e}")
        finally:
            # Cleanup temp PDF
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)

    print("\n🏁 Batch OCR Operation Complete.")

if __name__ == "__main__":
    run_batch_ocr()
