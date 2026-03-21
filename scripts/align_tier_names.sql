-- Add a 'name' column to 'user_tiers' for clarity in Supabase Dashboard
ALTER TABLE public.user_tiers ADD COLUMN IF NOT EXISTS name TEXT;

-- Populate it with the user-friendly names
UPDATE public.user_tiers SET name = 'Basic' WHERE id = 'free';
UPDATE public.user_tiers SET name = 'Basic+' WHERE id = 'basic';
UPDATE public.user_tiers SET name = 'Advance' WHERE id = 'advance';
UPDATE public.user_tiers SET name = 'Pro' WHERE id = 'pro';

-- Verification
SELECT id, name, daily_limit FROM public.user_tiers;
