import os
import pdfplumber
import fitz # PyMuPDF
from pathlib import Path

def table_to_markdown(table):
    if not table or not any(table):
        return ""
    
    # Filter empty rows
    table = [row for row in table if any(cell is not None and str(cell).strip() != "" for cell in row)]
    if not table:
        return ""

    # Ensure all cells are strings and deal with None
    clean_table = []
    for row in table:
        clean_row = [str(cell).replace("\n", " ") if cell is not None else "" for cell in row]
        clean_table.append(clean_row)

    if not clean_table:
        return ""

    headers = clean_table[0]
    rows = clean_table[1:]

    # Create header
    md = "| " + " | ".join(headers) + " |\n"
    # Create separator
    md += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    # Create rows
    for row in rows:
        md += "| " + " | ".join(row) + " |\n"
    
    return md + "\n"

def process_pdf(pdf_path, output_path):
    print(f"Processing: {pdf_path.name}")
    md_content = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # Extract tables per page
                extracted_tables = page.extract_tables()
                
                # Standard text
                page_text = page.extract_text()
                
                if extracted_tables:
                    md_content.append(f"## Page {page.page_number}\n")
                    md_content.append((page_text or "") + "\n\n")
                    
                    for table in extracted_tables:
                        md_content.append(table_to_markdown(table))
                else:
                    md_content.append((page_text or "") + "\n\n")
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("".join(md_content))
            
    except Exception as e:
        print(f"Error processing {pdf_path.name}: {e}")

def main():
    input_dir = Path(r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\Labour Laws\Original Pdf")
    output_dir = Path(r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\Labour Laws\Markdown Files")
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    pdf_files = list(input_dir.glob("*.pdf"))
    print(f"Found {len(pdf_files)} PDF files.")
    
    for pdf_file in pdf_files:
        output_file = output_dir / (pdf_file.stem + ".md")
        # Optimization: Only process if output doesn't exist
        if not output_file.exists():
            process_pdf(pdf_file, output_file)
        else:
            print(f"Skipping {pdf_file.name} (already exists)")

if __name__ == "__main__":
    main()
