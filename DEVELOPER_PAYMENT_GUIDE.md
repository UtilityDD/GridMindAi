# 💳 Developer Payment & Subscription Guide

This guide explains how to manage user tiers, modify pricing, and create promo codes for the GridMind AI project.

## 🏗️ Architecture Overview

The payment system is integrated across three layers:
1.  **Frontend (UI)**: [plans.ts](file:///d:/Dipankar/MyCodes/AI%20Projects/GridMindAi/frontend/src/lib/plans.ts) — Displays names, features, and prices.
2.  **Backend (API)**: [order/route.ts](file:///d:/Dipankar/MyCodes/AI%20Projects/GridMindAi/frontend/src/app/api/razorpay/order/route.ts) — Handles Razorpay charges.
3.  **Supabase (Database)**: `user_tiers` — Defines daily query limits.

---

## 🔼 1. How to Modify Subscription Tiers

To change a plan's price or description, update these two files:

### Step 1: Update Frontend Display
Modify the `PLANS` array in [plans.ts](file:///d:/Dipankar/MyCodes/AI%20Projects/GridMindAi/frontend/src/lib/plans.ts).
- **Price**: For display only (e.g., `price: 200`).
- **Description**: Use standard technical terms:
    - **"Standard Response"**: Used for Basic and Basic+.
    - **"Detailed/In-depth Intelligence"**: Applied to Advance and Pro.

### Step 2: Update Charge (Razorpay)
Update `PRICE_MAP_INR` in [order/route.ts](file:///d:/Dipankar/MyCodes/AI%20Projects/GridMindAi/frontend/src/app/api/razorpay/order/route.ts).
> [!IMPORTANT]
> Razorpay prices are in **paise** (100 paise = ₹1).
> Example: For ₹200 (Advance), set `price: 20000`.

---

## 📊 2. Managing Usage Limits (Daily Only)

GridMind AI uses **Daily Query Caps** for simplicity. Monthly caps are disabled (set to 999999).

1.  Open **Supabase Dashboard** -> `user_tiers` table.
2.  **Mapping Reference**:
    - `free`: Displayed as **Basic** (10 queries/day).
    - `basic`: Displayed as **Basic+** (10 queries/day).
    - `advance`: Displayed as **Advance** (50 queries/day).
    - `pro`: Displayed as **Pro** (150 queries/day).
3.  **Display Names**: Use the `name` column in `user_tiers` to see/set the "Nice Name" (e.g., 'Basic+').

---

## 🎟️ 3. Creating Promo Codes

Promo codes are in the `promo_codes` table.
- **code**: User input (e.g., `OFFER50`). UPPERCASE.
- **discount_percent**: Percentage off (e.g., 100 for free).
- **restricted_to_email**: Restrict to a specific user (comma-separated).

> [!NOTE]
> 100% discount codes offer a "Claim Free Access" button in the UI, bypassing Razorpay.

---

## 🛠️ 4. SQL Templates for Fast Management

### 🔌 A. Sync Tiers (Reset to Default Daily Limits)
```sql
UPDATE public.user_tiers SET daily_limit = 10, monthly_limit = 999999, name = 'Basic' WHERE id = 'free';
UPDATE public.user_tiers SET daily_limit = 10, monthly_limit = 999999, name = 'Basic+' WHERE id = 'basic';
UPDATE public.user_tiers SET daily_limit = 50, monthly_limit = 999999, name = 'Advance' WHERE id = 'advance';
UPDATE public.user_tiers SET daily_limit = 150, monthly_limit = 999999, name = 'Pro' WHERE id = 'pro';
```

### 👤 B. Instantly Upgrade User (Manual)
```sql
UPDATE profiles SET tier_id = 'pro' WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

---

## 🛠️ Testing Checklist
1. **Pricing**: Confirm price in [PricingModal](file:///d:/Dipankar/MyCodes/AI%20Projects/GridMindAi/frontend/src/components/PricingModal.tsx).
2. **Razorpay**: Check the amount in the checkout popup (it must match paise).
3. **Brain Check**: Verify "Detailed/In-depth" plans use Gemini Flash in [llm.ts](file:///d:/Dipankar/MyCodes/AI%20Projects/GridMindAi/frontend/src/lib/llm.ts).
