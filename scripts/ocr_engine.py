import os
import sys
import re
import fitz  # PyMuPDF
import google.generativeai as genai
import gc
from time import sleep

# --- CONFIGURATION ---
ENV_PATH = r"d:\Dipankar\MyCodes\AI Projects\GridMindAi\.env"

def get_keys():
    if not os.path.exists(ENV_PATH): return []
    with open(ENV_PATH, 'r') as f:
        for line in f:
            if line.startswith("GEMINI_KEY_POOL="):
                return [k.strip() for k in line.replace("GEMINI_KEY_POOL=", "").split(",") if k.strip()]
    return []

KEYS = get_keys()

SYSTEM_INSTRUCTION = """You are a professional engineering document transcriber. 
Convert the provided document image into HIGH-FIDELITY Markdown.

STRICT CONVERSION RULES:
1. TABLES: Preserving table structure is MANDATORY. Use standard pipe syntax (| --- |).
2. ENGINEERING SYMBOLS: Precisely transcribe symbols (Ω, μ, Ah, mm², kW, kV, kVA, Hz, etc.).
3. HIERARCHY: Maintain original header levels (# for titles, ## for sections).
4. DATA INTEGRITY: Transcribe technical values exactly. Do NOT summarize.
5. CLEANLINESS: Output ONLY the Markdown content.
"""

def process_single_pdf(source_path, target_path, initial_key_idx):
    """Processes a single PDF through Gemini Flash with internal key rotation."""
    global current_key_idx
    current_key_idx = initial_key_idx % len(KEYS)
    
    doc = None
    try:
        doc = fitz.open(source_path)
        full_markdown = []
        
        for i in range(len(doc)):
            print(f"  → Page {i+1}/{len(doc)}...", end="\r")
            page = doc[i]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_bytes = pix.tobytes("png")
            
            # Inner Retry Loop for Page Resilience
            page_done = False
            while not page_done:
                key = KEYS[current_key_idx]
                try:
                    genai.configure(api_key=key)
                    model = genai.GenerativeModel("models/gemini-flash-latest")
                    response = model.generate_content([
                        SYSTEM_INSTRUCTION,
                        {"mime_type": "image/png", "data": img_bytes}
                    ])
                    md = response.text.strip()
                    md_clean = re.sub(r"^.*?```markdown\n?", "", md, flags=re.DOTALL)
                    md_clean = re.sub(r"```$", "", md_clean).strip()
                    full_markdown.append(md_clean)
                    page_done = True
                except Exception as e:
                    if "429" in str(e):
                        # Rotate key and retry this page
                        old_idx = current_key_idx
                        current_key_idx = (current_key_idx + 1) % len(KEYS)
                        
                        # Full rotation detection: If we back at starting key for this page
                        if current_key_idx == initial_key_idx % len(KEYS):
                            print(f"\n  [429 ALERT] Entire 7-Key Pool Exhausted. Deep-Backoff for 300s...")
                            sleep(300)
                        else:
                            print(f"  [429] Key {old_idx} hit. Rotating to Key {current_key_idx} (30s buffer)...")
                            sleep(30)
                    else:
                        print(f"\n  [ERROR] Page {i+1} failed on Key {current_key_idx}: {e}")
                        import traceback
                        traceback.print_exc()
                        full_markdown.append(f"\n> [OCR ERROR: Page {i+1} failed: {e}]\n")
                        page_done = True
            
            del pix
            del img_bytes
            sleep(20.0) # Optimized throttle for Gemini Free Tier
            
        with open(target_path, "w", encoding="utf-8") as f:
            f.write("\n\n---\n\n".join(full_markdown))
        return "SUCCESS"
        
    except Exception as e:
        print(f"Error processing {source_path}: {e}")
        return "ERROR"
    finally:
        if doc: doc.close()
        gc.collect()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python ocr_engine.py <src> <dest> <key_idx>")
        sys.exit(1)
    
    src, dest, k_idx = sys.argv[1], sys.argv[2], int(sys.argv[3])
    result = process_single_pdf(src, dest, k_idx)
    print(result)
