import os
import re
import fitz  # PyMuPDF
import easyocr
import numpy as np

def run_easy_ocr():
    print("🚀 Starting DEEP Local OCR (EasyOCR Neural Engine)...")
    
    # Initialize reader (English only for speed/accuracy)
    print("Initializing EasyOCR models (First run may download weights)...")
    reader = easyocr.Reader(['en'], gpu=False) # Keep gpu=False for max safety on CPU
    
    # Paths
    base_dir = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    output_dir = os.path.join(base_dir, 'OCRs_PENDING')
    audit_log_path = r'd:\Dipankar\MyCodes\AI Projects\GridMindAi\scripts\ocr_full_audit.txt'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 1. Identify "MISSING" files from audit log
    missing_files = []
    if os.path.exists(audit_log_path):
        with open(audit_log_path, 'r', encoding='utf-8') as f:
            for line in f:
                if 'MISSING' in line.upper():
                    rel_path = line.split('|')[0].strip()
                    missing_files.append(rel_path)
    
    if not missing_files:
        print("No missing files found in audit log.")
        return

    print(f"Found {len(missing_files)} files to OCR.")
    success_count = 0
    
    for rel_path in missing_files:
        full_path = os.path.join(base_dir, rel_path)
        # Normalized output name
        out_name = re.sub(r'[^a-zA-Z0-9]', '_', os.path.splitext(os.path.basename(rel_path))[0]) + ".md"
        out_path = os.path.join(output_dir, out_name)
        
        if not os.path.exists(full_path):
            print(f"⚠️ Source missing: {full_path}")
            continue
            
        print(f"Processing: {rel_path}...")
        try:
            doc = fitz.open(full_path)
            full_text = [f"# {os.path.basename(rel_path)}\n"]
            
            for i, page in enumerate(doc):
                print(f"  - Rendering Page {i+1}/{len(doc)}...", end="\r")
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                
                print(f"  - OCR'ing Page {i+1}/{len(doc)}...", end="\r")
                results = reader.readtext(img_data, paragraph=True)
                
                if results:
                    page_text = "\n\n".join([res[1] for res in results])
                    full_text.append(f"## Page {i+1}\n\n{page_text}\n")
            
            print(f"  - Completed {len(doc)} pages.                ")
                
            if len(full_text) > 1:
                with open(out_path, 'w', encoding='utf-8') as md_file:
                    md_file.write("\n".join(full_text))
                print(f"✅ Reconstructed {rel_path}!")
                success_count += 1
            else:
                print(f"⚠️ No text recovered for {rel_path}.")
            
            doc.close()
        except Exception as e:
            print(f"❌ Failed {rel_path}: {str(e)}")

    print(f"\nFinal Result: {success_count}/{len(missing_files)} Reconstruction Successful.")

if __name__ == "__main__":
    run_easy_ocr()
