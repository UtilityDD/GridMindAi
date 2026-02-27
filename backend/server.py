"""FastAPI server exposing the RAG system as an API with Supabase Auth."""

from __future__ import annotations

import sys
import time
import logging
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client, Client

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import config
from retrieval.three_way import retrieve
from retrieval.context_builder import build_context
from generation.llm import generate_answer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="GridMind AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

_sb_client: Client | None = None


def _get_sb() -> Client:
    global _sb_client
    if _sb_client is None:
        _sb_client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    return _sb_client


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Supabase JWT by calling Supabase auth.get_user()."""
    token = credentials.credentials
    try:
        sb = _get_sb()
        user_response = sb.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "sub": user_response.user.id,
            "email": user_response.user.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Auth verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Authentication failed")


class AskRequest(BaseModel):
    question: str
    verbosity: int = 3
    model: str | None = None


class Source(BaseModel):
    doc_id: str
    ref: str
    date: str
    title: str
    source_url: str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
    model_used: str
    elapsed_ms: int
    rewritten_query: str | None = None


@app.post("/api/ask", response_model=AskResponse)
async def ask(req: AskRequest, user: dict = Depends(verify_token)):
    t0 = time.time()

    retrieval_result = retrieve(req.question)

    if not retrieval_result["doc_ids"]:
        return AskResponse(
            answer="No relevant documents found for your query.",
            sources=[],
            model_used="none",
            elapsed_ms=int((time.time() - t0) * 1000),
            rewritten_query=retrieval_result.get("rewritten_query"),
        )

    context, sources = build_context(retrieval_result)
    verbosity = max(1, min(5, req.verbosity))
    result = generate_answer(req.question, context, sources, verbosity=verbosity, model=req.model)

    return AskResponse(
        answer=result["answer"],
        sources=[Source(**s) for s in result["sources"]],
        model_used=result["model_used"],
        elapsed_ms=int((time.time() - t0) * 1000),
        rewritten_query=retrieval_result.get("rewritten_query"),
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
