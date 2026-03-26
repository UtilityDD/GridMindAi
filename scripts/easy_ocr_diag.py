import os
import re
import fitz  # PyMuPDF
import easyocr
import numpy as np
import time

def diag_easy_ocr():
    print("🧪 EASYOCR DIAGNOSTIC START")
    
    # 1. Model Loading
    start = time.time()
    print(" - Loading models (CPU)...")
    reader = easyocr.Reader(['en'], gpu=False)
    print(f" - Model loaded in {time.time()-start:.2f}s")
    
    # 2. File Check
    test_pdf = r'D:\Dipankar\MyCodes\AI Projects\OCR Required for GridMind\Ancillary Services Regulations, 2023 (Principal Regulation).pdf'
    if not os.path.exists(test_pdf):
        print("❌ Test PDF missing")
        return
        
    print(f" - Processing Page 1 of: {os.path.basename(test_pdf)}")
    doc = fitz.open(test_pdf)
    page = doc[0]
    
    # 3. Rendering
    print(" - Rendering...")
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    print(f" - Image shape: {img_data.shape}")
    
    # 4. OCR
    print(" - OCR Start (Neural Inference)...")
    ocr_start = time.time()
    results = reader.readtext(img_data, paragraph=True)
    print(f" - OCR Finished in {time.time()-ocr_start:.2f}s")
    
    if results:
        print("✅ SUCCESS!")
        print(f" - Text length: {len(results[0][1])}")
        print(f" - Preview: {results[0][1][:100]}...")
    else:
        print("⚠️ No text detected")
    
    doc.close()

if __name__ == "__main__":
    diag_easy_ocr()
