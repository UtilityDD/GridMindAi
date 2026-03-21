-- Remove monthly limits for simplify as requested
-- Set to a very high number to effectively disable enforcement
UPDATE public.user_tiers SET monthly_limit = 999999;

-- Ensure advance tier exists if missing
INSERT INTO public.user_tiers (id, daily_limit, monthly_limit)
VALUES ('advance', 50, 999999)
ON CONFLICT (id) DO UPDATE 
SET daily_limit = 50, 
    monthly_limit = 999999;

-- Final Sync of daily limits (Free: 10, Basic: 10, Advance: 50, Pro: 150)
UPDATE public.user_tiers SET daily_limit = 10 WHERE id = 'free';
UPDATE public.user_tiers SET daily_limit = 10 WHERE id = 'basic';
UPDATE public.user_tiers SET daily_limit = 50 WHERE id = 'advance';
UPDATE public.user_tiers SET daily_limit = 150 WHERE id = 'pro';

-- Verification
SELECT * FROM public.user_tiers;
