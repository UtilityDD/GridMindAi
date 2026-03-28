import os
import subprocess
import time

# --- CONFIGURATION ---
SOURCE_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Pdf"
TARGET_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Md"

def is_failed_file(md_path):
    if not os.path.exists(md_path): return True
    if os.path.getsize(md_path) < 1500: return True 
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # If placeholders exist, re-process
            return "[OCR ERROR:" in content
    except:
        return True

def run_batch():
    pdfs = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(".pdf")]
    print(f"🚀 Starting Fault-Tolerant Orchestrator for {len(pdfs)} files...")
    
    key_idx = 0
    
    for idx, pdf_name in enumerate(pdfs):
        source_path = os.path.join(SOURCE_DIR, pdf_name)
        target_name = os.path.splitext(pdf_name)[0] + ".md"
        target_path = os.path.join(TARGET_DIR, target_name)
        
        if not is_failed_file(target_path):
            print(f"⏩ [{idx+1}/{len(pdfs)}] Clean: {pdf_name}")
            continue
            
        print(f"📄 [{idx+1}/{len(pdfs)}] Orchestrating: {pdf_name}...")
        
        while True:
            # Call engine as sub-process for isolation
            try:
                result_proc = subprocess.run(
                    ["python", "ocr_engine.py", source_path, target_path, str(key_idx)],
                    capture_output=True, text=True, timeout=1800 # 30 min max per file
                )
                
                output = result_proc.stdout.strip()
                if "SUCCESS" in output:
                    print(f"✅ Recovery Successful: {pdf_name}")
                    key_idx += 1
                    break
                elif "429" in output:
                    print(f"⚠️ Quota Block (429). Backing off for 300s...")
                    time.sleep(300)
                    key_idx += 1 # Try next key after break
                else:
                    print(f"❌ Engine Error for {pdf_name}. Retrying in 60s...")
                    print(f"DEBUG: {result_proc.stderr}")
                    time.sleep(60)
                    
            except subprocess.TimeoutExpired:
                print(f"⏰ Timeout on {pdf_name}. Re-spawning...")
                time.sleep(30)
    
    print("\n🏁 Fault-Tolerant Technical Recovery Complete.")

if __name__ == "__main__":
    run_batch()
