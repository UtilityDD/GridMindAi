-- Rate Limiting Table
-- This tracks hits for specific identifiers (IP or User ID) on specific routes
-- to prevent brute-force attacks and resource exhaustion.

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- user_id or IP address
    route TEXT NOT NULL,      -- Example: 'api/promo/validate'
    hits INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(identifier, route)
);

-- Index for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits (identifier, route);

-- RLS: Only service_role (admin) should manage this table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to rate_limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Optional: Automatic cleanup of old windows (Run via Cron if available or manual trigger)
-- DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';
