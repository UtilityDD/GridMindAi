import fitz
import easyocr
import os
import numpy as np
import time
import psutil

# --- CONFIGURATION ---
SOURCE_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\pdf_from_anirban"
OUTPUT_DIR = os.path.join(SOURCE_DIR, "OCRs")
# Set to 1 worker to prevent system hangs on high-CPU tasks
NUM_WORKERS = 1 

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def set_low_priority():
    """Set the current process to low priority to keep system responsive."""
    try:
        p = psutil.Process(os.getpid())
        p.nice(psutil.BELOW_NORMAL_PRIORITY_CLASS)
        print("💡 Process priority set to BELOW_NORMAL (High-Grit Safe-Mode active)")
    except Exception as e:
        print(f"⚠️ Could not set process priority: {e}")

def process_pdfs(pdf_list):
    """High-Grit Safe-Mode OCR processing."""
    set_low_priority()
    print(f"🚀 Starting High-Grit OCR for {len(pdf_list)} files...")
    
    # Initialize reader once
    reader = easyocr.Reader(['en'], gpu=False)
    
    for rel_path in pdf_list:
        full_path = os.path.join(SOURCE_DIR, rel_path)
        safe_name = rel_path.replace(" ", "_").replace(".pdf", ".md")
        out_path = os.path.join(OUTPUT_DIR, safe_name)
        
        # NOTE: Skipping is disabled to allow High-Grit (mag_ratio=2.0) upgrade for already done files
        print(f"📄 Processing (High-Grit): {rel_path}...")
        try:
            doc = fitz.open(full_path)
            full_text = [f"# {os.path.basename(rel_path)}\n"]
            
            for i, page in enumerate(doc):
                # High-fidelity 3x upscaling (Physical resolution)
                pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
                img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                
                # Neural Magnification (mag_ratio=2.0) for character precision
                results = reader.readtext(img_data, 
                                        paragraph=True, 
                                        detail=0, 
                                        mag_ratio=2.0, 
                                        contrast_ths=0.1, 
                                        adjust_contrast=0.7)
                
                if results:
                    page_text = "\n\n".join(results)
                    full_text.append(f"## Page {i+1}\n\n{page_text}\n")
                
                # Small pause to allow CPU to breathe
                time.sleep(0.5)
            
            if len(full_text) > 1:
                with open(out_path, 'w', encoding='utf-8') as md_file:
                    md_file.write("\n".join(full_text))
                print(f"✅ [High-Grit Success] Reconstructed: {rel_path}")
            else:
                print(f"⚠️ No text discovered for {rel_path}.")
            
            doc.close()
            # Cool down between documents
            time.sleep(1)
        except Exception as e:
            print(f"❌ Error on {rel_path}: {e}")

if __name__ == "__main__":
    all_pdfs = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith('.pdf')]
    process_pdfs(all_pdfs)
    print("🏁 Total Collection RE-Reconstruction Complete (High-Grit).")
