# 💳 GridMind AI Developer & Operations Guide

This guide covers subscription management, admin controls, environment variables, and the deployment pipeline for GridMind AI.

---

## 🌐 1. Repository & Deployment Infrastructure

- **Primary Repository**: [https://github.com/gridmindinfo/GridMindAI.git](https://github.com/gridmindinfo/GridMindAI.git)
- **Framework & Subdirectory**: Next.js 15 (App Router) located in `/frontend`.
- **Hosting Platform**: Vercel (Hobby Tier).
- **Vercel Settings**:
  - **Root Directory**: `frontend`
  - **Framework Preset**: `Next.js`
  - **Build Command**: `npm run build` (`next build --no-lint`)
  - **Output Directory**: `.next`

---

## 👑 2. Administrator Access & Auto-Activation

### Primary Admin Account: `dipnkr.das@gmail.com`
- **Automatic Promotion**:  
  When `dipnkr.das@gmail.com` logs in, the backend ([/api/user/usage](file:///c:/Dipankar/GridMindAi/frontend/src/app/api/user/usage/route.ts)) automatically upgrades the profile:
  - `tier_id = 'admin'`
  - `custom_daily_limit = 999999` (Unlimited)
  - `is_enabled = true`
- **Bypassed Restrictions**:
  - No 30-day trial expiry.
  - No burst cooldowns (30s rapid-fire restriction).
  - No daily query caps.

### Visual Admin Console: `/admin`
- Accessible directly via the sidebar navigation (*Admin Console* link with a Shield icon) or at `/admin`.
- Allows administrators to:
  - View all registered accounts, join dates, and today's query usage.
  - Change any user's tier (*Basic, Basic+, Advance, Pro, Administrator*).
  - Set custom daily limits per user.
  - Toggle account status (*Active* / *Disabled*).

---

## 🏗️ 3. Payment & Subscription Architecture

The payment system spans three layers:
1. **Frontend (UI)**: [plans.ts](file:///c:/Dipankar/GridMindAi/frontend/src/lib/plans.ts) — Displays names, features, and prices.
2. **Backend (API)**: [order/route.ts](file:///c:/Dipankar/GridMindAi/frontend/src/app/api/razorpay/order/route.ts) — Handles Razorpay charges.
3. **Supabase (Database)**: `user_tiers` & `profiles` — Controls query quotas.

### Modifying Tiers:
- **Frontend Display**: Update `PLANS` in [plans.ts](file:///c:/Dipankar/GridMindAi/frontend/src/lib/plans.ts).
- **Charges (Razorpay)**: Update `PRICE_MAP_INR` in [order/route.ts](file:///c:/Dipankar/GridMindAi/frontend/src/app/api/razorpay/order/route.ts). (Amounts in paise: ₹200 = `20000`).

---

## 📊 4. Usage Quota Mapping

| Tier ID | Display Name | Default Daily Cap |
| :--- | :--- | :--- |
| `free` | Basic | 10 queries/day (30-day trial) |
| `basic` | Basic+ | 10 queries/day |
| `advance` | Advance | 50 queries/day |
| `pro` | Pro | 150 queries/day |
| `admin` | Administrator | 999,999 (Unlimited) |

Monthly caps are set to 999,999 for simplicity.

---

## 🎟️ 5. Promo Codes

Promo codes live in the `promo_codes` table:
- `code`: UPPERCASE string (e.g., `SPECIAL100`).
- `discount_percent`: 0 to 100. (100% discount allows instant bypass via "Claim Free Access").
- `restricted_to_email`: Optional email restriction.

---

## 🛠️ 6. Useful SQL Commands (Supabase SQL Editor)

```sql
-- 1. Ensure Admin Tier Exists
INSERT INTO public.user_tiers (id, name, daily_limit, monthly_limit)
VALUES ('admin', 'Administrator', 999999, 999999)
ON CONFLICT (id) DO UPDATE SET daily_limit = 999999;

-- 2. Manually Promote Any User to Admin
UPDATE public.profiles
SET tier_id = 'admin', custom_daily_limit = 999999, is_enabled = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- 3. Reset Standard Tier Limits
UPDATE public.user_tiers SET daily_limit = 10, monthly_limit = 999999, name = 'Basic' WHERE id = 'free';
UPDATE public.user_tiers SET daily_limit = 10, monthly_limit = 999999, name = 'Basic+' WHERE id = 'basic';
UPDATE public.user_tiers SET daily_limit = 50, monthly_limit = 999999, name = 'Advance' WHERE id = 'advance';
UPDATE public.user_tiers SET daily_limit = 150, monthly_limit = 999999, name = 'Pro' WHERE id = 'pro';
```
