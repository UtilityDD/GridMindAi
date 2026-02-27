# WBSEDCL Circulars RAG System

A Retrieval-Augmented Generation system for WBSEDCL (West Bengal State Electricity Distribution Company Limited) circulars and office orders. Designed for internal use.

## Features

- **Web scraper** that fetches all circulars from the TSSA website
- **Three-way RAG retrieval** (chunks, per-document summaries, document titles) for high-quality results
- **Gemini vision OCR** for image-based PDFs (paid initial batch), with Tesseract fallback
- **Gemini embeddings** (`gemini-embedding-001`) and Gemini LLM for answer generation, with OpenAI fallback
- **ChromaDB** local vector store (free, no server needed)
- **"Adding new files" workflow** — drop PDFs in a folder, run the pipeline, done

## Project Structure

```
rag/
├── adding_new_files/        # Drop new PDFs here (staging folder)
│   └── manifest.json        # Metadata for each PDF in the folder
├── scraper/                 # Website scraping
├── pipeline/                # Text extraction, OCR, chunking, summarization, embedding
├── retrieval/               # Three-way vector search + context building
├── generation/              # LLM prompt construction + answer generation
├── app/                     # CLI interface
├── scripts/                 # Convenience scripts
├── data/
│   ├── chroma/              # ChromaDB vector store (auto-created)
│   └── processed_pdfs/      # PDFs moved here after processing
├── config.py                # All configuration in one place
├── requirements.txt
└── .env.example
```

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

For Tesseract OCR (optional fallback):
```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu/Debian
sudo apt install tesseract-ocr tesseract-ocr-ben
```

### 2. Configure API keys

```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key    # optional, used as fallback
```

Get a Gemini API key (free tier available): https://aistudio.google.com/apikey

## Usage

All commands are run from the project root (`rag/`).

### Step 1: Scrape and download circulars

```bash
# Preview what will be scraped (no downloads)
python -m app.cli scrape --dry-run

# Download all PDFs into adding_new_files/
python -m app.cli scrape
```

This fetches the circulars table from the website, downloads each PDF into `adding_new_files/`, and writes `manifest.json` with metadata (ref, date, title, keywords, URL).

### Step 2: Run the ingestion pipeline

```bash
# Use Gemini vision for OCR (recommended for initial batch, paid)
python -m app.cli pipeline --ocr gemini

# Use Tesseract only (free, for incremental updates)
python -m app.cli pipeline --ocr tesseract

# Use config default
python -m app.cli pipeline
```

The pipeline processes each PDF in `adding_new_files/`:
1. Extracts text (native or OCR)
2. Chunks with large overlap
3. Generates a per-PDF summary via Gemini
4. Embeds chunks, summary, and title into ChromaDB (three collections)
5. Moves the processed PDF to `data/processed_pdfs/`

### Step 3: Ask questions

```bash
python -m app.cli ask "What is the holiday list for 2026?"
python -m app.cli ask "What are the rules for medical reimbursement?"
python -m app.cli ask "What is the revised rate for LT Mobile Van Service?"
```

The system:
1. Searches across chunks, summaries, and titles (3-5 results from each)
2. Merges results to identify the most relevant PDFs
3. Builds context from the matched chunks and summaries
4. Generates an answer with citations (ref, date, title, URL)

## Adding New Files Later

### Option A: Re-run the scraper

```bash
python -m app.cli scrape      # only downloads new PDFs not already processed
python -m app.cli pipeline
```

### Option B: Add files manually

1. Copy your PDF into `adding_new_files/`
2. Register it in the manifest:
   ```bash
   python -m app.cli add-manifest "my-circular.pdf" \
       --ref "O.O.No.123" \
       --date "15.02.2026" \
       --title "Subject of the circular"
   ```
3. Run the pipeline:
   ```bash
   python -m app.cli pipeline
   ```

The pipeline only processes files in `adding_new_files/`. After processing, files are moved to `data/processed_pdfs/` automatically.

## Configuration

All settings are in `config.py`:

| Setting | Default | Description |
|---------|---------|-------------|
| `CHUNK_SIZE` | 512 | Approximate tokens per chunk |
| `CHUNK_OVERLAP` | 128 | Token overlap between chunks |
| `EMBEDDING_MODEL` | `gemini-embedding-exp-03-07` | Gemini embedding model |
| `EMBEDDING_DIMENSIONS` | 768 | Embedding vector dimensions |
| `GEMINI_LLM_MODEL` | `gemini-2.5-flash` | LLM for summaries and answers |
| `OCR_USE_GEMINI` | `True` | Use Gemini vision for OCR by default |
| `RETRIEVAL_TOP_K_*` | 5 | Top-k results per retrieval path |

## How Three-Way RAG Works

```
User Question
    │
    ├──► Chunk Search  ──► top 5 chunks (passage-level)
    ├──► Summary Search ──► top 5 docs (document-level)
    └──► Title Search   ──► top 5 docs (by name/title)
              │
              ▼
        Merge unique doc IDs
              │
              ▼
     Build context (chunks + summaries for those docs)
              │
              ▼
     Generate answer with citations (Gemini / OpenAI fallback)
```

## Convenience Scripts

```bash
python scripts/run_scraper.py     # Scrape + download
python scripts/run_pipeline.py    # Run pipeline (--ocr gemini|tesseract|auto)
```
