-- ====================================================================
-- GRIDMIND AI: USER APPROVAL WORKFLOW FOR SUPABASE
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- ====================================================================

-- 1. Set default column value of is_enabled to FALSE for new profiles
ALTER TABLE public.profiles 
ALTER COLUMN is_enabled SET DEFAULT false;

-- 2. Update the auth.users trigger so all new Google sign-ins default to is_enabled = false
--    (Except the system administrator: dipnkr.das@gmail.com)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(NEW.email) = 'dipnkr.das@gmail.com' THEN
    INSERT INTO public.profiles (id, tier_id, is_enabled, custom_daily_limit, custom_monthly_limit, created_at)
    VALUES (NEW.id, 'admin', true, 999999, 999999, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET tier_id = 'admin', custom_daily_limit = 999999, custom_monthly_limit = 999999, is_enabled = true;
  ELSE
    INSERT INTO public.profiles (id, tier_id, is_enabled, created_at)
    VALUES (NEW.id, 'free', false, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- OPTIONAL: RESET EXISTING ACCOUNTS TO REQUIRE APPROVAL
-- If you want to require approval for all existing test accounts 
-- (except dipnkr.das@gmail.com), uncomment and run the query below:
-- ====================================================================

-- UPDATE public.profiles
-- SET is_enabled = false
-- WHERE id NOT IN (
--   SELECT id FROM auth.users WHERE LOWER(email) = 'dipnkr.das@gmail.com'
-- );
