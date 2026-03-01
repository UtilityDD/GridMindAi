# GridMind AI: Strategic Intelligence for the Power Sector

GridMind AI is an elite, RAG-powered (Retrieval-Augmented Generation) intelligence platform designed specifically for the professional Indian Electricity Sector. It transforms thousands of complex regulatory documents into actionable strategic insights with precision and high-performance aesthetics.

---

## 👤 User Perspective (The Strategy Center)

GridMind provides a seamless "Command Center" experience for grid managers, policy analysts, and regulatory consultants.

### 🔥 Key Features
- **Semantic Intelligence**: Ask questions in natural language (e.g., *"What is the latest amendment on grid stability for WBERC?"*) and get cited, professional answers instantly.
- **Dynamic Synthesis**: Adjust the "Synthesist Level" (Verbosity) to get exactly what you need—from a quick tactical summary to a deep context structural analysis.
- **Persistent Memory**: Your tactical query history is preserved locally, allowing for instant recovery of previous insights without redundant requests.
- **Tiered Access**: Scale your capabilities using flexible membership tiers:
  - **Field Agent**: For tactical, daily lookups.
  - **Strategic Lead**: For consistent regulatory oversight.
  - **Grid Master**: For enterprise-scale neural mapping and analytics.
- **Promotion Redemption**: Unlock premium intelligence using universal or user-specific promo codes within the Strategic Overview panel.

---

## 💻 Developer Perspective (The Infrastructure)

GridMind AI is built on a modern, scalable stack focusing on high-performance retrieval and low-latency interaction.

### 🏗️ Architecture & Flow
1. **Query Rewriting**: Every user inquiry is rewritten by specialized LLM templates to maximize semantic retrieval accuracy.
2. **Hybrid Retrieval**:
   - **Vector Search**: Uses `pgvector` to find semantically relevant chunks across thousands of regulatory pages.
   - **Keyword Extraction**: Simultaneously extracts key policy terms for granular analytics.
3. **Context Injection**: The `rag.ts` layer builds a dense context from top-ranked fragments, including automatic amendment-awareness logic.
4. **LLM Synthesis**: The final answer is generated using models like **Gemini 2.5 Flash** or **Llama 3.3 70B**, enforcing a formal, 7-section structured output.

### 🔐 Multi-Layer Controls
- **Supabase Integration**: Handles Auth, RLS (Row Level Security), and vectorized storage.
- **Account status**: The `is_enabled` flag at the API level provides instant administrative account control.
- **Custom Overrides**: A flexible limit system allows developers to override tier defaults for specific priority users directly in the database.

---

## �️ Database Architecture (PostgreSQL/Supabase)

### 📄 Intelligence Content
| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `chunks` | Granular text fragments | `content` (TEXT), `embedding` (VECTOR-768), `doc_id` (TEXT) |
| `summaries` | Per-document syntheses | `summary_text` (TEXT), `embedding` (VECTOR-768) |
| `titles` | Document indexing | `title` (TEXT), `embedding` (VECTOR-768) |

### 🎟️ Administration & Promo
| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `promo_codes` | Discount & Access Codes | `code`, `discount_percent`, `valid_until`, `max_uses`, `restricted_to_email` |
| `profiles` | User Preferences & Status | `tier_id`, `is_enabled`, `custom_daily_limit`, `custom_monthly_limit` |
| `user_tiers` | Tier Definition | `id`, `daily_limit`, `monthly_limit` |
| `user_analytics` | Keyword & Usage Tracking | `original_query`, `rewritten_query`, `keywords` (JSONB) |

---

## 🚀 Technical Setup

1. **Environment Config**:
   Configure `frontend/.env.local` with your Supabase and LLM API keys.
2. **Database Migration**:
   1. Execute `supabase_schema.sql` to initialize vector storage and functions.
   2. Execute `supabase_promo_schema.sql` to initialize the administrative layer.
3. **Frontend Boot**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---
*GridMind AI: Powering Strategic Decisions through Neural Intelligence.*
