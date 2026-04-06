-- SQL Migration: Targeted Relevance Check for Smart Cache (RIV - Relevance Invalidation)
-- This function identifies if ANY new chunks added since 'since_timestamp'
-- match the query embedding above a certain 'match_threshold'.

DROP FUNCTION IF EXISTS match_new_chunks(vector, timestamp with time zone, double precision, integer);

CREATE OR REPLACE FUNCTION match_new_chunks (
  query_embedding vector(768),
  since_timestamp TIMESTAMP WITH TIME ZONE,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.chunks c
  WHERE c.created_at > since_timestamp
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
