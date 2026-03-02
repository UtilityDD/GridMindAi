-- Create site_stats table
CREATE TABLE IF NOT EXISTS public.site_stats (
    id TEXT PRIMARY KEY,
    visitor_count BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize the row if it doesn't exist
INSERT INTO public.site_stats (id, visitor_count)
VALUES ('main', 0)
ON CONFLICT (id) DO NOTHING;

-- Function to increment visitor count
CREATE OR REPLACE FUNCTION increment_visitor_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count BIGINT;
BEGIN
    UPDATE public.site_stats
    SET visitor_count = visitor_count + 1,
        updated_at = NOW()
    WHERE id = 'main'
    RETURNING visitor_count INTO new_count;
    
    RETURN new_count;
END;
$$;
