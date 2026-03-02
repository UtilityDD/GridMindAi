-- Backfill Script for Existing Users
-- This script ensures that all users in auth.users have a corresponding entry in public.profiles
-- default tier is 'free'

INSERT INTO public.profiles (id, tier_id, is_enabled, created_at)
SELECT 
    id, 
    'free' as tier_id, 
    true as is_enabled,
    now() as created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Verification query
-- SELECT count(*) FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);
