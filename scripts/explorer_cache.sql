-- 1. Create the query_cache table for Semantic Caching
-- This table stores previously answered questions and their AI responses.
-- We use a 'state_token' (MAX created_at from chunks) for instant invalidation.

CREATE TABLE IF NOT EXISTS public.query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    embedding vector(768) NOT NULL, -- Matched against incoming query vectors
    answer TEXT NOT NULL,           -- The full AI response
    sources JSONB NOT NULL,         -- Citations metadata
    model_used TEXT NOT NULL,       -- Which model generated this (e.g., OpenRouter/DeepSeek-R1)
    state_token TIMESTAMP WITH TIME ZONE NOT NULL, -- The DB state at time of caching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add an HNSW index for fast semantic matching on queries
-- This allows sub-50ms vector searches even with thousands of cached entries.
CREATE INDEX IF NOT EXISTS query_cache_embedding_idx ON public.query_cache 
USING hnsw (embedding vector_cosine_ops);

-- 3. Create the match_query_cache function
-- Returns the most similar valid cache entry if above a similarity threshold.
CREATE OR REPLACE FUNCTION match_query_cache (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  query TEXT,
  answer TEXT,
  sources JSONB,
  model_used TEXT,
  state_token TIMESTAMP WITH TIME ZONE,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qc.id,
    qc.query,
    qc.answer,
    qc.sources,
    qc.model_used,
    qc.state_token,
    1 - (qc.embedding <=> query_embedding) AS similarity
  FROM public.query_cache qc
  WHERE 1 - (qc.embedding <=> query_embedding) > match_threshold
  ORDER BY qc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Create a function to get the current Database State Token
-- This is used to invalidate the cache if new chunks are added.
CREATE OR REPLACE FUNCTION get_current_state_token()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT MAX(created_at) FROM public.chunks);
END;
$$;
