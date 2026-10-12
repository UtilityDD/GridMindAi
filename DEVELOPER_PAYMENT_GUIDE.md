# 💳 GridMind AI Developer & Operations Guide

This guide covers subscription management, admin controls, environment variables, and the deployment pipeline for GridMind AI.

---

## 🌐 1. Repository & Deployment Infrastructure

- **Primary Repository**: [https://github.com/gridmindinfo/GridMindAI.git](https://github.com/gridmindinfo/GridMindAI.git) (`origin`)
- **Mirror Repository**: [https://github.com/UtilityDD/GridMindAi.git](https://github.com/UtilityDD/GridMindAi.git) (`utilitydd`)
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

---

## 🎨 7. UI Architecture & Design Standards

### Landing Page ([LandingPage.tsx](file:///c:/Dipankar/GridMindAi/frontend/src/components/LandingPage.tsx))
- **Aesthetic**: Authentic power utility editorial design. No generic AI templates, pulsating glows, or buzzword marketing.
- **Key Features**:
  - Live Operational Case Terminal (Section 135 theft, 11kV/33kV line clearances, DTR failure timeframes, DPS formulas, ROPA 2020 pay scales).
  - Editorial comparison: *Why Generic AI Fails for Power Utilities* (hallucinations vs. verified operative circulars).
  - Live Circular Index Docket Preview with direct link to the 4,200+ circular directory at `/explorer`.

### Main Inquiry Console ([page.tsx](file:///c:/Dipankar/GridMindAi/frontend/src/app/page.tsx))
- **Aesthetic**: Modern, clean ChatGPT-grade utility console.
- **Unified Single Header Architecture**:
  - Eliminated cluttered dual headers (sidebar header pane + main header pane).
  - Single, persistent top header (`h-14`, 56px) housing:
    - Sidebar toggle button (`PanelLeftClose` / `PanelLeftOpen`) with clear tooltips.
    - Model indicator pill (`4.0 RAG`).
    - New Chat button with shortcut tooltip.
    - LiveStats pill displaying today's verified query usage against the user's tier quota.
  - Sidebar desktop container integrates seamlessly under the top header, collapsing cleanly into an icon rail without redundant branding blocks or duplicate close controls.
- **Workspace Layout**:
  - Centered empty state with greeting (*"What can I help with?"*) and 2x2 clickable prompt cards.
  - User bubble in high-contrast ChatGPT styling (`#f4f4f4`, `rounded-3xl`, right-aligned).
  - Assistant response with markdown tables, statutory citations, and action bar (Copy, Thumbs Up/Down, Regenerate, Share, and Report).
  - Floating bottom input bar (`rounded-[26px] bg-[#f4f4f4]`) with auto-expanding textarea, Plus button, verbosity depth slider, and circular send button.
  - Draggable split-screen document viewer for side-by-side circular verification, supporting native high-performance inline PDF rendering, Reader mode, and Markdown summaries.

---

## 🤖 8. Free Multi-Key LLM Pool & RAG Pipeline

GridMind AI operates on a 100% free multi-provider LLM infrastructure with automatic fallback and load-balancing:

### Key Rotation & Model Hierarchy
1. **Primary Synthesis Engine (Groq Pool)**:
   - Rotates across multiple Groq API keys (`GROQ_API_KEY`, `GROQ_API_KEY_1`, ..., `GROQ_API_KEY_8`).
   - Primary model: `openai/gpt-oss-120b` (or `qwen/qwen3.8-27b`).
   - **Reasoning Token Management**:
     - Configured with `max_tokens: 800` for RAG synthesis and `max_tokens: 2500` for conversational queries.
     - Parses both standard response text (`message.content`) and chain-of-thought tokens (`message.reasoning`), preventing empty responses or timeout failures caused by exhausted reasoning budgets.
2. **Fallback Synthesis Engine (Gemini Pool)**:
   - Rotates across Google Gemini API keys (`GEMINI_API_KEY`, `GEMINI_API_KEY_1`, ...).
   - Upgraded to `gemini-2.5-flash` for low latency (~2.5s) and zero 503 high-demand errors.
3. **Embedding Engine**:
   - `gemini-embedding-001` (768 dimensions), compatible with Supabase `pgvector`.
4. **Retrieval Safety Fallback**:
   - Neural reranking applies relevance scoring. If reranker scores conservatively, `retrieve()` automatically retains the top vector matches to guarantee context is never dropped to 0 chunks.

---

## 📈 9. Consumption & Analytics Pipeline

- **Universal Query Logging**:
  Every user inquiry—whether synthesized via LLM, served from memory cache, or returning zero matches—invokes `logAnalytics()`, inserting a record into `user_analytics`.
- **Usage Calculation**:
  `GET /api/user/usage` queries `user_analytics` for the authenticated user since midnight (IST), calculating exact real-time consumption.
- **Client Sync**:
  Live stats pill in the top header and the user profile modal automatically refresh after each inquiry, ensuring the quota counter stays in lockstep with database usage.

---

## 📑 10. Document & PDF Viewer Engine

- **Unrestricted, High-Fidelity Rendering**:
  - Eliminated artificial right-click blocking, restrictive security warnings, and text selection prevention. Users and utility engineers can highlight text, copy order references, and inspect tables freely.
  - Native browser PDF rendering (`iframe` / `object`) serves as the primary engine, guaranteeing that 100% of pages in multi-page circulars load smoothly without Canvas GPU memory limits or lazy-load race conditions.
  - Built-in Reader Mode (sequential PDF.js) and Markdown support (`ReactMarkdown`) provide multi-format flexibility.
- **Smart Proxy & Normalization ([pdf-proxy/route.ts](file:///c:/Dipankar/GridMindAi/frontend/src/app/api/pdf-proxy/route.ts))**:
  - Automatically resolves DNS routing anomalies (e.g., `www.tssawbseb.com` lacking an A-record, resolving seamlessly to `tssawbseb.com`).
  - **Fuzzy Repository Tree Matcher (`github-gridmind-files.json`)**: Eliminates 404 and 503 errors when ingested chunks contain sanitized filenames with underscores (such as `Miscellaneous_Provisions_Regulations__2013__Principal_Regulation_.pdf`). Matches alphanumeric character signatures against the 776 repository files and routes directly to the raw binary file.
  - **503/429 Protection**: Bypasses GitHub's HTML blob page endpoints (which trigger bot-detection 503/429 status codes) and downloads directly from `raw.githubusercontent.com`.
  - Emits proper `Content-Type: application/pdf`, `Content-Disposition: inline`, and CORS headers (`*`) to ensure immediate preview without download-forcing behavior.
- **Quick-Action Toolbar**:
  - Single-click **Open in New Tab** (`ExternalLink`) and **Download** (`Download`) options so users always have unrestricted access to original documents.

---

## 🚀 11. Safe Deployment & Verification Protocol

Follow this verified sequence for every deployment:

### Step 1: Pre-Commit Quality Gate
Run from `frontend/`:
```bash
# 1. Type validation
npx tsc --noEmit

# 2. Production build verification
npm run build
```

### Step 2: Git Synchronization
Stage, commit, and push to both remotes:
```bash
git add .
git commit -m "feat/fix: descriptive summary of changes"
git push origin main
git push utilitydd main
```

### Step 3: Post-Deployment Smoke Tests
1. **Health Check**: `GET /api/health` returns `{ "status": "ok" }`.
2. **Quota & Analytics**: `GET /api/user/usage` returns current user tier and today's usage.
3. **Document Proxy**: Verify `/api/pdf-proxy?url=<pdf_url>` returns `HTTP 200` with `Content-Type: application/pdf`.
4. **Interactive Chat**: Submit test query in the console; confirm instant response streaming, accurate citations, and live usage count update in the top header.

