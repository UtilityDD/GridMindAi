import os
import re
import fitz  # PyMuPDF
import google.generativeai as genai
import gc
from time import sleep

# --- CONFIGURATION ---
SOURCE_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Pdf"
TARGET_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Md"
ENV_PATH = r"d:\Dipankar\MyCodes\AI Projects\GridMindAi\.env"

def get_keys():
    if not os.path.exists(ENV_PATH): return []
    with open(ENV_PATH, 'r') as f:
        for line in f:
            if line.startswith("GEMINI_KEY_POOL="):
                return [k.strip() for k in line.replace("GEMINI_KEY_POOL=", "").split(",") if k.strip()]
    return []

KEYS = get_keys()
current_key_idx = 0

def ocr_page_to_markdown(pixmap_data):
    global current_key_idx
    
    # Infinite Retry Loop for resilience
    while True:
        key = KEYS[current_key_idx]
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(
                model_name="models/gemini-flash-latest",
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]
            )
            
            response = model.generate_content([
                SYSTEM_INSTRUCTION,
                {"mime_type": "image/png", "data": pixmap_data}
            ])
            return response.text.strip()
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str:
                # Quota hit. Try next key.
                old_idx = current_key_idx
                current_key_idx = (current_key_idx + 1) % len(KEYS)
                
                # If we've circled the whole pool, wait significantly
                if current_key_idx == 0:
                    print(f"\n  [QUOTA FULL] All keys hit limit. Cooling down for 300s (5min)...")
                    sleep(300)
                else:
                    print(f"  [429] Key {old_idx} hit. Swapping to Key {current_key_idx} (30s buffer)...")
                    sleep(30)
            else:
                print(f"\n  [API ERROR] Retrying in 10s: {e}")
                sleep(10)

# --- OCR ENGINE ---

SYSTEM_INSTRUCTION = """You are a professional engineering document transcriber. 
Convert the provided document image into HIGH-FIDELITY Markdown.

STRICT CONVERSION RULES:
1. TABLES: Preserving table structure is MANDATORY. Use standard pipe syntax (| --- |).
   - Capture every row and column exactly as shown.
2. ENGINEERING SYMBOLS: Precisely transcribe symbols (Ω, μ, Ah, mm², kW, kV, kVA, Hz, etc.).
3. HIERARCHY: Maintain original header levels (# for titles, ## for sections).
4. DATA INTEGRITY: Transcribe every technical value. Do NOT summarize or omit parameters.
5. CLEANLINESS: Output ONLY the Markdown content.

If the page is too blurry or impossible to transcribe, note it as [ERROR: Page unreadable].
"""

def is_failed_file(md_path):
    """Check if the existing Markdown file contains OCR errors or is too small."""
    if not os.path.exists(md_path): return True
    if os.path.getsize(md_path) < 1500: return True 
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
            return content.count("[OCR ERROR:") > (content.count("---") // 2)
    except:
        return True

def process_pdfs():
    if not os.path.exists(TARGET_DIR): os.makedirs(TARGET_DIR)
    
    pdfs = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(".pdf")]
    print(f"🚀 Starting Resilient Technical OCR (7-Key Pool) for {len(pdfs)} files...")
    
    for idx, pdf_name in enumerate(pdfs):
        source_path = os.path.join(SOURCE_DIR, pdf_name)
        target_name = os.path.splitext(pdf_name)[0] + ".md"
        target_path = os.path.join(TARGET_DIR, target_name)
        
        if not is_failed_file(target_path):
            print(f"⏩ [{idx+1}/{len(pdfs)}] Clean: {pdf_name}")
            continue
            
        print(f"📄 [{idx+1}/{len(pdfs)}] Processing: {pdf_name}...")
        doc = None
        try:
            doc = fitz.open(source_path)
            full_markdown = []
            
            for i in range(len(doc)):
                print(f"  → Page {i+1}/{len(doc)}...", end="\r")
                page = doc[i]
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_bytes = pix.tobytes("png")
                
                md = ocr_page_to_markdown(img_bytes)
                if md:
                    md_clean = re.sub(r"^.*?```markdown\n?", "", md, flags=re.DOTALL)
                    md_clean = re.sub(r"```$", "", md_clean).strip()
                    full_markdown.append(md_clean)
                else:
                    full_markdown.append(f"\n> [OCR ERROR: Internal Page failure]\n")
                
                del pix
                del img_bytes
                sleep(15.0) 
            
            with open(target_path, "w", encoding="utf-8") as f:
                f.write("\n\n---\n\n".join(full_markdown))
                
            print(f"\n✅ Success: {target_name}                ")
            
        except Exception as e:
            print(f"\n❌ Failure in loop for {pdf_name}: {e}")
        finally:
            if doc: doc.close()
            gc.collect()
            sleep(5.0)

if __name__ == "__main__":
    process_pdfs()
