-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- ============================================================
-- CHUNKS TABLE (main chunked text + embeddings)
-- ============================================================
create table public.chunks (
  id text primary key,
  doc_id text not null,
  ref text default '',
  date text default '',
  title text default '',
  source_url text default '',
  chunk_index int default 0,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz default now()
);

create index idx_chunks_doc_id on public.chunks(doc_id);
create index idx_chunks_embedding on public.chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================
-- SUMMARIES TABLE (per-document summaries + embeddings)
-- ============================================================
create table public.summaries (
  id text primary key,
  doc_id text not null unique,
  ref text default '',
  date text default '',
  title text default '',
  source_url text default '',
  summary_text text not null,
  embedding vector(768) not null,
  created_at timestamptz default now()
);

create index idx_summaries_doc_id on public.summaries(doc_id);
create index idx_summaries_embedding on public.summaries
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ============================================================
-- TITLES TABLE (document titles/keywords + embeddings)
-- ============================================================
create table public.titles (
  id text primary key,
  doc_id text not null unique,
  ref text default '',
  date text default '',
  title text default '',
  source_url text default '',
  embedding vector(768) not null,
  created_at timestamptz default now()
);

create index idx_titles_doc_id on public.titles(doc_id);
create index idx_titles_embedding on public.titles
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ============================================================
-- SIMILARITY SEARCH FUNCTIONS (called from Python)
-- ============================================================

create or replace function match_chunks(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id text,
  doc_id text,
  ref text,
  date text,
  title text,
  source_url text,
  chunk_index int,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      c.id,
      c.doc_id,
      c.ref,
      c.date,
      c.title,
      c.source_url,
      c.chunk_index,
      c.content,
      1 - (c.embedding <=> query_embedding) as similarity
    from public.chunks c
    order by c.embedding <=> query_embedding
    limit match_count;
end;
$$;

create or replace function match_summaries(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id text,
  doc_id text,
  ref text,
  date text,
  title text,
  source_url text,
  summary_text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      s.id,
      s.doc_id,
      s.ref,
      s.date,
      s.title,
      s.source_url,
      s.summary_text,
      1 - (s.embedding <=> query_embedding) as similarity
    from public.summaries s
    order by s.embedding <=> query_embedding
    limit match_count;
end;
$$;

create or replace function match_titles(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id text,
  doc_id text,
  ref text,
  date text,
  title text,
  source_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      t.id,
      t.doc_id,
      t.ref,
      t.date,
      t.title,
      t.source_url,
      1 - (t.embedding <=> query_embedding) as similarity
    from public.titles t
    order by t.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (all tables readable by authenticated users)
-- ============================================================

alter table public.chunks enable row level security;
alter table public.summaries enable row level security;
alter table public.titles enable row level security;

create policy "Authenticated users can read chunks"
  on public.chunks for select
  to authenticated
  using (true);

create policy "Service role can manage chunks"
  on public.chunks for all
  to service_role
  using (true);

create policy "Authenticated users can read summaries"
  on public.summaries for select
  to authenticated
  using (true);

create policy "Service role can manage summaries"
  on public.summaries for all
  to service_role
  using (true);

create policy "Authenticated users can read titles"
  on public.titles for select
  to authenticated
  using (true);

create policy "Service role can manage titles"
  on public.titles for all
  to service_role
  using (true);
