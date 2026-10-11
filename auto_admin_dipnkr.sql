-- ====================================================================
-- AUTO-ACTIVATE ADMIN PROFILE FOR dipnkr.das@gmail.com
-- ====================================================================

-- 1. Ensure 'admin' tier exists in user_tiers with unlimited quotas
INSERT INTO public.user_tiers (id, name, daily_limit, monthly_limit)
VALUES ('admin', 'Administrator', 999999, 999999)
ON CONFLICT (id) DO UPDATE 
SET name = 'Administrator', daily_limit = 999999, monthly_limit = 999999;

-- 2. Update trigger to automatically assign 'admin' tier for dipnkr.das@gmail.com
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
    VALUES (NEW.id, 'free', true, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Upgrade existing dipnkr.das@gmail.com record if already signed up
UPDATE public.profiles
SET 
  tier_id = 'admin',
  custom_daily_limit = 999999,
  custom_monthly_limit = 999999,
  is_enabled = true
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE LOWER(email) = 'dipnkr.das@gmail.com'
);
