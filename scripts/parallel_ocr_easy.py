import os
import re
import fitz
import easyocr
import numpy as np
from multiprocessing import Process, cpu_count

def process_bucket(bucket_id, files_to_process):
    print(f"🚀 Worker {bucket_id} starting for {len(files_to_process)} files...")
    
    # Initialize reader per process (to avoid CUDA/resource locks)
    reader = easyocr.Reader(['en'], gpu=False)
    
    base_dir = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    output_dir = os.path.join(base_dir, 'OCRs_PENDING')

    for rel_path in files_to_process:
        full_path = os.path.join(base_dir, rel_path)
        out_name = re.sub(r'[^a-zA-Z0-9]', '_', os.path.splitext(os.path.basename(rel_path))[0]) + ".md"
        out_path = os.path.join(output_dir, out_name)
        
        print(f"[Worker {bucket_id}] Processing: {rel_path}...")
        try:
            doc = fitz.open(full_path)
            full_text = [f"# {os.path.basename(rel_path)}\n"]
            
            for i, page in enumerate(doc):
                # 3x upscaling (approx 216 DPI) is much more reliable for these older regulation scans
                pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
                img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                
                results = reader.readtext(img_data, paragraph=True)
                if results:
                    page_text = "\n\n".join([res[1] for res in results])
                    full_text.append(f"## Page {i+1}\n\n{page_text}\n")
            
            # Write if any text gathered
            if len(full_text) > 1:
                with open(out_path, 'w', encoding='utf-8') as md_file:
                    md_file.write("\n".join(full_text))
                print(f"✅ [Worker {bucket_id}] Reconstructed {rel_path}!")
            else:
                print(f"⚠️ [Worker {bucket_id}] No text discovered for {rel_path}.")
            
            doc.close()
        except Exception as e:
            print(f"❌ [Worker {bucket_id}] Failed {rel_path}: {str(e)}")

def run_parallel_ocr():
    base_dir = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind'
    audit_log_path = r'd:\Dipankar\MyCodes\AI Projects\GridMindAi\scripts\ocr_full_audit.txt'
    
    # 1. Gather files
    missing_files = []
    if os.path.exists(audit_log_path):
        with open(audit_log_path, 'r', encoding='utf-8') as f:
            for line in f:
                if 'MISSING' in line.upper():
                    missing_files.append(line.split('|')[0].strip())
    
    if not missing_files:
        print("No files to process.")
        return

    # 2. Partition files into 4 buckets
    num_workers = 4
    buckets = [[] for _ in range(num_workers)]
    for i, file in enumerate(missing_files):
        buckets[i % num_workers].append(file)
    
    # 3. Launch Processes
    print(f"Starting {num_workers} Parallel OCR Workers for {len(missing_files)} files...")
    processes = []
    for i in range(num_workers):
        p = Process(target=process_bucket, args=(i, buckets[i]))
        p.start()
        processes.append(p)
    
    for p in processes:
        p.join()
        
    print("\nAll Workers Finished! 🏁")

if __name__ == "__main__":
    run_parallel_ocr()
