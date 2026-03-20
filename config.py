import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

# --- API Keys ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_KEY_POOL = (
    os.getenv("GEMINI_KEY_POOL") or 
    os.getenv("GEMINI_API_KEYS") or 
    os.getenv("GEMINI_API_KEY", "")
).split(",")
GEMINI_KEY_POOL = [k.strip() for k in GEMINI_KEY_POOL if k.strip()]
GEMINI_PAID_KEY = os.getenv("GEMINI_PAID_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# --- Supabase ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# --- Paths ---
ADDING_NEW_FILES_DIR = BASE_DIR / "adding_new_files"
MANIFEST_PATH = ADDING_NEW_FILES_DIR / "manifest.json"
PROCESSED_PDFS_DIR = BASE_DIR / "data" / "processed_pdfs"
PROCESSED_MANIFEST_PATH = BASE_DIR / "data" / "processed_manifest.json"
CHROMA_DIR = BASE_DIR / "data" / "chroma"
PROMPTS_DIR = BASE_DIR / "prompts"

# --- Chunking ---
CHUNK_SIZE = 350          # tokens (stricter limit for TPM safety)
CHUNK_OVERLAP = 60        # tokens
SENTENCE_BOUNDARY = True  # prefer splitting on sentence boundaries

# --- Embedding ---
EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768
EMBEDDING_BATCH_SIZE = 1  # Sequential (batch size 1) as requested
EMBEDDING_RATE_LIMIT_RPM = 120  # 30 RPM per key (1 chunk / 2s) * 4 keys

# --- LLM ---
GEMINI_LLM_MODEL = "gemini-2.5-flash"
OPENAI_LLM_MODEL = "gpt-4o-mini"
LLM_MAX_RETRIES = 10
LLM_RETRY_DELAY = 10.0  # seconds

# --- OCR ---
OCR_MIN_TEXT_LENGTH = 50  # chars; below this, page is treated as image-only
OCR_USE_GEMINI = True     # True = Gemini vision for OCR; False = Tesseract only
GEMINI_VISION_MODEL = "gemini-2.5-flash"

# --- Parallelization ---
DOWNLOAD_WORKERS = 10     # concurrent PDF downloads
PIPELINE_WORKERS = 1      # concurrent document processing
EXTRACT_WORKERS = 6       # concurrent text extraction (CPU-bound)

# --- Retrieval ---
RETRIEVAL_TOP_K_CHUNKS = 5
RETRIEVAL_TOP_K_SUMMARIES = 5
RETRIEVAL_TOP_K_TITLES = 5
MAX_CONTEXT_CHUNKS_PER_DOC = 3  # cap chunks per doc in final context

# --- ChromaDB collection names ---
CHROMA_COLLECTION_CHUNKS = "chunks"
CHROMA_COLLECTION_SUMMARIES = "summaries"
CHROMA_COLLECTION_TITLES = "titles"

# --- Scraper ---
SCRAPER_URL = "https://www.tssawbseb.com/DCLorder.php"
SCRAPER_BASE_URL = "https://www.tssawbseb.com/"
SCRAPER_DELAY = 0.5  # seconds between PDF downloads
