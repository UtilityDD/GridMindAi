import os
import re
import fitz  # PyMuPDF
import subprocess

# 1. Inject Tesseract into the environment PATH and TESSDATA_PREFIX
TESS_DIR = r'C:\Users\dipnk\AppData\Local\Tesseract-OCR'
os.environ["PATH"] = TESS_DIR + os.path.pathsep + os.environ["PATH"]
os.environ["TESSDATA_PREFIX"] = TESS_DIR

def run_true_ocr():
    print("🚀 Starting DEEP Local OCR (Env-Injection Strategy)...")
    
    # Paths
    base_dir = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    output_dir = os.path.join(base_dir, 'OCRs_PENDING')
    audit_log_path = r'd:\Dipankar\MyCodes\AI Projects\GridMindAi\scripts\ocr_full_audit.txt'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 2. Identify "MISSING" files from audit log
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
    original_cwd = os.getcwd()
    success_count = 0
    
    for rel_path in missing_files:
        full_path = os.path.join(base_dir, rel_path)
        out_name = re.sub(r'[^a-zA-Z0-9]', '_', os.path.splitext(os.path.basename(rel_path))[0]) + ".md"
        out_path = os.path.join(output_dir, out_name)
        
        if not os.path.exists(full_path):
            print(f"⚠️ Source missing: {full_path}")
            continue
            
        print(f"Processing: {rel_path}...")
        try:
            doc = fitz.open(full_path)
            full_text = []
            
            # Switch context to output dir
            os.chdir(output_dir)
            
            for i, page in enumerate(doc):
                img_rel = f"tmp_{success_count}_p{i}.png"
                out_base_rel = f"tmp_{success_count}_out{i}"
                out_file_rel = out_base_rel + ".txt"
                
                # Render
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                pix.save(img_rel)
                
                # Execute tesseract - now that the PATH is injected, we can use the simple command
                cmd = f'tesseract "{img_rel}" "{out_base_rel}" -l eng'
                try:
                    # Capture output to help debug if it fails
                    subprocess.run(cmd, shell=True, check=True, capture_output=True)
                    
                    if os.path.exists(out_file_rel):
                        with open(out_file_rel, 'r', encoding='utf-8') as tf:
                            txt = tf.read().strip()
                        if txt: full_text.append(f"## Page {i+1}\n\n{txt}\n")
                except Exception:
                    pass
                finally:
                    for f in [img_rel, out_file_rel]:
                        if os.path.exists(f): 
                            try: os.remove(f)
                            except: pass
            
            os.chdir(original_cwd)
            if full_text:
                with open(out_path, 'w', encoding='utf-8') as md_file:
                    md_file.write("\n".join(full_text))
                print(f"✅ Reconstructed {rel_path}!")
                success_count += 1
            else:
                print(f"  - No text recovered.")
            doc.close()
        except Exception as e:
            os.chdir(original_cwd)
            print(f"❌ Failed: {str(e)}")

    print(f"\nFinal Result: {success_count}/{len(missing_files)} Reconstructed.")

if __name__ == "__main__":
    run_true_ocr()
