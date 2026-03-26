import os
import fitz  # PyMuPDF
from paddleocr import PaddleOCR
import numpy as np
import time

def diag_paddle_ocr():
    print("🧪 PADDLEOCR DIAGNOSTIC START")
    
    # 1. Model Loading
    start = time.time()
    print(" - Loading models (CPU)...")
    # Try absolute minimal init to avoid arg errors in 3.4.0
    ocr = PaddleOCR()
    # Note: Default is usually 'ch' (Chinese/English). We'll see if it works.
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
    result = ocr.ocr(img_data, cls=False)
    print(f" - OCR Finished in {time.time()-ocr_start:.2f}s")
    
    if result and result[0]:
        print("✅ SUCCESS!")
        text = " ".join([line[1][0] for line in result[0]])
        print(f" - Text length: {len(text)}")
        print(f" - Preview: {text[:100]}...")
    else:
        print("⚠️ No text detected")
    
    doc.close()

if __name__ == "__main__":
    diag_paddle_ocr()
