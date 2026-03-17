-- Backfill public.profiles.created_at from auth.users
-- This ensures existing users have their original registration date for trial enforcement

UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id
  AND p.created_at IS NULL;

-- Also ensure all auth users have a profile entry
INSERT INTO public.profiles (id, tier_id, is_enabled, created_at)
SELECT 
    id, 
    'free' as tier_id, 
    true as is_enabled,
    created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
