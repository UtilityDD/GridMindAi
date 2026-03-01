-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    restricted_to_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update profiles table with administrative controls
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_daily_limit INTEGER,
ADD COLUMN IF NOT EXISTS custom_monthly_limit INTEGER;

-- RLS Policies for promo_codes (Admin only can manage, all authenticated can read)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read promo codes"
ON promo_codes FOR SELECT
TO authenticated
USING (true);

-- Assuming there's a way to identify admins (e.g., via a column in profiles)
-- For now, we'll keep it simple: only the service role or manual SQL can insert/update/delete.
