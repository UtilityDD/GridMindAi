import os
import re
import pdfplumber

def run_local_ocr():
    print("🚀 Starting Local OCR Batch (pdfplumber Engine)...")
    
    # Paths
    base_dir = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    output_dir = os.path.join(base_dir, 'OCRs_PENDING')
    audit_log_path = r'd:\Dipankar\MyCodes\AI Projects\GridMindAi\scripts\ocr_full_audit.txt'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output folder: {output_dir}")

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

    print(f"Found {len(missing_files)} files to convert.")
    success_count = 0
    
    for rel_path in missing_files:
        full_path = os.path.join(base_dir, rel_path)
        out_name = re.sub(r'[^a-zA-Z0-9]', '_', os.path.splitext(os.path.basename(rel_path))[0]) + ".md"
        out_path = os.path.join(output_dir, out_name)
        
        if not os.path.exists(full_path):
            print(f"⚠️ Source missing: {full_path}")
            continue
            
        print(f"Converting: {rel_path}...")
        try:
            text_blocks = []
            with pdfplumber.open(full_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        text_blocks.append(f"## Page {i+1}\n\n{text}\n")
            
            if not text_blocks:
                # If no text extracted, maybe it's a scanned image
                # For now, we note it.
                print(f"⚠️ No text found in {rel_path} (likely a scanned image).")
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write("# SCAN REQUIRED\nThis PDF appears to be a scanned image and requires OCR software (like Tesseract).")
            else:
                with open(out_path, 'w', encoding='utf-8') as md_file:
                    md_file.write("\n".join(text_blocks))
                print(f"✅ Success!")
                success_count += 1
        except Exception as e:
            print(f"❌ Failed {rel_path}: {str(e)}")

    print(f"\nBatch Complete! 🏁 Successfully converted {success_count}/{len(missing_files)} files.")

if __name__ == "__main__":
    run_local_ocr()
