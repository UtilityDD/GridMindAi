"""Chunk extracted text into overlapping segments for embedding."""

from __future__ import annotations

import re
import config


def _approx_token_count(text: str) -> int:
    """Rough token estimate: ~0.75 tokens per word."""
    return int(len(text.split()) * 0.75)


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences using basic heuristics."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[str]:
    """
    Split *text* into chunks of approximately *chunk_size* tokens
    with *chunk_overlap* tokens of overlap, preferring sentence boundaries.
    """
    if chunk_size is None:
        chunk_size = config.CHUNK_SIZE
    if chunk_overlap is None:
        chunk_overlap = config.CHUNK_OVERLAP

    sentences = _split_sentences(text)
    if not sentences:
        return []

    chunks: list[str] = []
    current_sentences: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sent_tokens = _approx_token_count(sentence)

        if current_tokens + sent_tokens > chunk_size and current_sentences:
            chunks.append(" ".join(current_sentences))

            # keep overlap: walk backwards from end of current_sentences
            overlap_sentences: list[str] = []
            overlap_tokens = 0
            for s in reversed(current_sentences):
                st = _approx_token_count(s)
                if overlap_tokens + st > chunk_overlap:
                    break
                overlap_sentences.insert(0, s)
                overlap_tokens += st

            current_sentences = overlap_sentences
            current_tokens = overlap_tokens

        current_sentences.append(sentence)
        current_tokens += sent_tokens

    if current_sentences:
        chunks.append(" ".join(current_sentences))

    return chunks
