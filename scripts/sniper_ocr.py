import sys
import os
import fitz  # PyMuPDF
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
import numpy as np

def sniper_ocr(pdf_path, md_path):
    print(f"🎯 Sniper OCR Target: {os.path.basename(pdf_path)}")
    
    try:
        doc = fitz.open(pdf_path)
        engine = RapidOCR()
        full_text = []
        
        for page_num in range(len(doc)):
            print(f"  Page {page_num+1}/{len(doc)}...")
            page = doc.load_page(page_num)
            
            # 1. Try text extraction first (Memory efficient)
            text = page.get_text().strip()
            if len(text) > 100:
                full_text.append(text)
                continue
            
            # 2. Extreme Forensic Snapshot
            pix = page.get_pixmap(matrix=fitz.Matrix(5, 5)) # 500 DPI
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Phase A: High Contrast Grayscale
            from PIL import ImageEnhance, ImageOps
            gray = ImageOps.grayscale(img)
            enhanced = ImageEnhance.Contrast(gray).enhance(4.0)
            
            # Phase B: Inverted check (for negative scans)
            inverted = ImageOps.invert(enhanced)
            
            # Attempt OCR on both (Normal then Inverted)
            for candidate in [enhanced, inverted]:
                result, _ = engine(np.array(candidate.convert("RGB")))
                if result:
                    page_text = "\n".join([line[1] for line in result])
                    full_text.append(page_text)
                    break
            
            # Explicit memory cleanup
            pix = None
            img = None
            
        final_md = "\n\n---\n\n".join(full_text)
        
        if len(final_md.strip()) < 200:
            print("❌ OCR Failed: Blank output")
            return False
            
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(final_md)
            
        print(f"✅ Success: {md_path}")
        return True
        
    except Exception as e:
        print(f"💥 Critical Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python sniper_ocr.py <pdf> <md>")
        sys.exit(1)
    
    success = sniper_ocr(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
