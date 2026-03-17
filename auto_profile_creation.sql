-- Auto-create profiles for new users
-- This trigger fires when a new user signs up in auth.users
-- It automatically creates a corresponding profile with tier_id = 'free'

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, tier_id, is_enabled, created_at)
  VALUES (NEW.id, 'free', true, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Verification query (run after deploying trigger)
-- SELECT COUNT(*) as users_without_profiles FROM auth.users 
-- WHERE id NOT IN (SELECT id FROM public.profiles);
-- Expected result: 0
