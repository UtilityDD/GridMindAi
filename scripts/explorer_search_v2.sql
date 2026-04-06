-- SQL Migration: Triple-Weighted Precision Search (RAG v2)
-- Implementation: Title/Ref Emphasis + Document Deduplication

-- 1. Ensure we have GIN indices on all searchable metadata
CREATE INDEX IF NOT EXISTS idx_chunks_title_fts ON chunks USING GIN (to_tsvector('english', coalesce(title, '')));
CREATE INDEX IF NOT EXISTS idx_chunks_ref_fts ON chunks USING GIN (to_tsvector('english', coalesce(ref, '')));

-- 2. Advanced Multi-Field Weighted Search RPC
CREATE OR REPLACE FUNCTION match_chunks_kts_v2 (
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
  WITH raw_matches AS (
    SELECT
      c.id,
      c.doc_id,
      c.content,
      c.ref,
      c.date,
      c.title,
      c.source_url,
      c.chunk_index,
      -- Weighted Ranking Logic:
      -- A = Title (1.0), B = Ref (0.4), D = Content (0.1)
      ts_rank_cd(
        setweight(to_tsvector('english', coalesce(c.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(c.ref, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(c.content, '')), 'D'),
        websearch_to_tsquery('english', query_text)
      ) AS rank
    FROM chunks c
    WHERE 
      (to_tsvector('english', coalesce(c.title, '')) || 
       to_tsvector('english', coalesce(c.ref, '')) || 
       to_tsvector('english', coalesce(c.content, ''))) 
      @@ websearch_to_tsquery('english', query_text)
  ),
  deduplicated_docs AS (
    -- Ensure only the single most relevant chunk per document is returned
    SELECT DISTINCT ON (doc_id)
      *
    FROM raw_matches
    ORDER BY doc_id, rank DESC
  )
  SELECT
    *
  FROM deduplicated_docs
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;
