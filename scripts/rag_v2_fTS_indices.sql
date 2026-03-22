-- SQL Migration: Add Full-Text Search (FTS) to GridMind (RAG v2)
-- Phase 8: Hybrid Retrieval Enablement

-- 1. Add GIN Index for Chunks (Content-based)
-- We use English by default, but consider also enabling 'simple' if search is very literal.
CREATE INDEX IF NOT EXISTS idx_chunks_fts ON chunks USING GIN (to_tsvector('english', content));

-- 2. Add GIN Index for Summaries
CREATE INDEX IF NOT EXISTS idx_summaries_fts ON summaries USING GIN (to_tsvector('english', summary_text));

-- 3. Add GIN Index for Titles
CREATE INDEX IF NOT EXISTS idx_titles_fts ON titles USING GIN (to_tsvector('english', title));

-- 4. RPC for Keyword Match (Chunks)
CREATE OR REPLACE FUNCTION match_chunks_kts (
  query_text text,
  match_count int
)
RETURNS TABLE (
  id uuid,
  doc_id uuid,
  content text,
  ref text,
  date text,
  title text,
  source_url text,
  chunk_index int,
  rank float4
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.doc_id,
    c.content,
    c.ref,
    c.date,
    c.title,
    c.source_url,
    c.chunk_index,
    ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', query_text)) AS rank
  FROM chunks c
  WHERE to_tsvector('english', c.content) @@ plainto_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;
