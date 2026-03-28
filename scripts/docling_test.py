from docling.document_converter import DocumentConverter
import os
import sys

# Configure IO
source = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Pdf\4.01.02 TECHNICAL SPECIFICATION FOR ACSR CONDUCTORS DATED 21.08.2025.pdf"
dest = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\new collection\TS Md\docling_40102.md"

def run_test():
    print(f"🚀 Starting Docling conversion for: {os.path.basename(source)}")
    try:
        converter = DocumentConverter()
        result = converter.convert(source)
        
        # Export to Markdown
        markdown_content = result.document.export_to_markdown()
        
        with open(dest, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        print("✅ SUCCESS: File saved to TS Md/docling_40102.md")
    except Exception as e:
        print(f"❌ ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_test()
