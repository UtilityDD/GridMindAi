from docling.document_converter import DocumentConverter
import os
import sys
import time
import subprocess
from pathlib import Path

# Enforce UTF-8 for console output on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Paths
SOURCE_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Pdf"
TARGET_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Md"

def process_single_file(pdf_path, md_path):
    """Processes a single PDF using Docling and saves to Markdown."""
    try:
        print(f"📄 Processing: {os.path.basename(pdf_path)}")
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        md_text = result.document.export_to_markdown()
        
        if len(md_text.strip()) < 200:
            raise ValueError("Conversion produced blank or insufficient output (likely OOM/Silent Fail)")
            
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_text)
        
        return True
    except Exception as e:
        print(f"❌ Error on {pdf_path}: {e}")
        return False

import subprocess

def process_single_file_isolated(pdf_path, md_path):
    """Spawns a fresh child process for a single conversion to reclaim RAM."""
    print(f"📄 Processing (Isolated): {os.path.basename(pdf_path)}")
    script_path = os.path.abspath(__file__)
    
    # Call ourselves with the file path as an argument
    try:
        result = subprocess.run(
            [sys.executable, script_path, pdf_path, md_path],
            capture_output=True,
            text=True,
            encoding='utf-8', # Explicitly set encoding
            timeout=600 # 10 min timeout
        )
        if result.returncode == 0:
            print(f"✅ Isolated Success: {os.path.basename(pdf_path)}")
            return True
        else:
            print(f"❌ Isolated Failure: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"⏰ Timeout on {os.path.basename(pdf_path)}")
        return False

def main():
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)

    # WORKER MODE: Process single file passed via CLI
    if len(sys.argv) == 3:
        pdf_file = sys.argv[1]
        md_file = sys.argv[2]
        process_single_file(pdf_file, md_file)
        return

    # ORCHESTRATOR MODE: Batch loop
    all_pdfs = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(".pdf")]
    total = len(all_pdfs)
    
    print(f"🚀 Scaling Process-Isolated Docling across {total} files...")
    
    for i, pdf_name in enumerate(all_pdfs):
        pdf_path = os.path.join(SOURCE_DIR, pdf_name)
        md_name = pdf_name.replace(".pdf", ".md")
        md_path = os.path.join(TARGET_DIR, md_name)
        
        # Aggressive Resume logic: 
        if os.path.exists(md_path):
             size = os.path.getsize(md_path)
             with open(md_path, "r", encoding="utf-8", errors='ignore') as f:
                 chunk = f.read(2048)
                 has_error = "[OCR ERROR]" in chunk or "[ERROR]" in chunk
             
             if size > 5120 and not has_error:
                 continue # Silent skip for speed
             else:
                 print(f"🔄 Re-processing {pdf_name} (Reason: low fidelity)")

        success = process_single_file_isolated(pdf_path, md_path)
        
        status = "✅" if success else "❌"
        print(f"[{i+1}/{total}] {status} {pdf_name}")
        
        # Short pause for disk I/O
        time.sleep(1)

if __name__ == "__main__":
    main()
