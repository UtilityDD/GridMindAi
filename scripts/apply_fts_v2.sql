-- Updated SQL Migration: Add Full-Text Search (FTS) with TEXT-based IDs
-- We explicitly set the return types to match our current schema (text vs uuid)

-- 1. Ensure GIN Index for Chunks (Content-based)
CREATE INDEX IF NOT EXISTS idx_chunks_fts ON chunks USING GIN (to_tsvector('english', content));

-- 2. DROP old function if it exists (required because we are changing return types from UUID to TEXT)
DROP FUNCTION IF EXISTS match_chunks_kts(text, int);

-- 3. Create the Search-as-you-type RPC
CREATE OR REPLACE FUNCTION match_chunks_kts (
  query_text text,
  match_count int
)
RETURNS TABLE (
  id text,
  doc_id text,
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
