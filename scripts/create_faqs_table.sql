-- Table to store high-priority, curated FAQs (Phase 6)
CREATE TABLE IF NOT EXISTS faqs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  doc_id UUID REFERENCES titles(doc_id),
  embedding vector(1536), -- Match with Gemini embedding dimensions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for similarity search
CREATE INDEX ON faqs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- RPC for FAQ matching
CREATE OR REPLACE FUNCTION match_faqs (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  question text,
  answer text,
  category text,
  doc_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.category,
    f.doc_id,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM faqs f
  WHERE 1 - (f.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
