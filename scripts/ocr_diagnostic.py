import os
import re
import fitz  # PyMuPDF
import subprocess

def run_diagnostic_ocr():
    print("🚀 Starting OCR Diagnostic (Single File Focus)...")
    
    # Paths
    base_dir = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    output_dir = os.path.join(base_dir, 'OCRs_PENDING')
    tesseract_exe = "C:/Users/dipnk/AppData/Local/Tesseract-OCR/tesseract.exe"
    
    # Single target file for testing
    rel_path = "Ancillary Services Regulations, 2023 (Principal Regulation).pdf"
    full_path = os.path.join(base_dir, rel_path)
    
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        return

    print(f"Targeting: {rel_path}")
    doc = fitz.open(full_path)
    full_text = []
    
    # Render ONLY the first page for diagnostic
    try:
        page = doc[0]
        img_rel = "diag_page_0.png"
        out_base_rel = "diag_out_0"
        
        # We'll use the current script dir as temp
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        pix.save(img_rel)
        print(f" - Saved diagnostic image: {img_rel}")
        
        # Call Tesseract with full visibility
        cmd = f'"{tesseract_exe}" "{img_rel}" "{out_base_rel}" -l eng'
        print(f" - Executing: {cmd}")
        
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        print(f" - Exit Code: {result.returncode}")
        if result.stdout: print(f" - STDOUT: {result.stdout.strip()}")
        if result.stderr: print(f" - STDERR: {result.stderr.strip()}")
        
        out_file = out_base_rel + ".txt"
        if os.path.exists(out_file):
            with open(out_file, 'r', encoding='utf-8') as f:
                txt = f.read().strip()
                print(f" - Recovered Text (first 50 chars): {txt[:50]}...")
        else:
            print(f" - ERROR: Output file {out_file} was not created.")

    except Exception as e:
        print(f"❌ Diagnostic Exception: {str(e)}")
    finally:
        doc.close()
        # Keep the files for manual inspection if they exist
        print("\nDiagnostic check finish. Look above for Tesseract error logs.")

if __name__ == "__main__":
    run_diagnostic_ocr()
