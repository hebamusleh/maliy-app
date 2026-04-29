# Research: ماليّ Full UI Implementation

**Feature**: 002-maliy-ui-implementation
**Date**: 2026-04-29
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. Next.js 14 App Router with Arabic RTL

**Decision**: Use Next.js App Router with `lang="ar" dir="rtl"` on the root `<html>` element (already in place in `src/app/layout.tsx`). All pages are server components by default; client interactivity is isolated via `"use client"` directives.

**Rationale**: The existing `layout.tsx` already sets `lang="ar" dir="rtl"`. The App Router supports nested layouts, enabling the 3-column shell (Sidebar + Main + Chat) to wrap all pages without re-mounting.

**Findings**:
- Arabic RTL in Tailwind: use `rtl:` prefix utilities and logical properties (`ps-`, `pe-`, `ms-`, `me-`) instead of `pl-`/`pr-`. The existing `tailwind.config` implicitly enables RTL support via Tailwind v4 logical properties.
- Font loading: replace the commented-out Google Fonts `<link>` with `next/font/google` in `layout.tsx` to avoid FOUC and enable preloading. Three families: Reem Kufi (headings), Noto Naskh Arabic (body), Fraunces (numbers).
- The 3-column grid (`280px | 1fr | 400px`) will be implemented as a persistent shell layout in `src/components/layout/Layout.tsx` using Tailwind grid classes.

**Alternatives considered**:
- Pages Router: Rejected — project already uses App Router.
- i18n libraries (next-intl): Rejected — single-language Arabic app, no translation needed.

---

## 2. Charts: Recharts (Constitution-mandated; replaces prototype's Chart.js)

**Decision**: Use Recharts for all data visualizations. The constitution explicitly mandates Recharts; the prototype's Chart.js CDN usage is a prototype artifact only.

**Chart type mapping from prototype → Recharts**:

| Prototype chart | Recharts component |
|---|---|
| Cash-flow line (dashboard) | `<AreaChart>` with gradient fill |
| Project distribution (donut) | `<PieChart>` with `innerRadius` |
| Daily spending (bar) | `<BarChart>` |
| Forecast curve (area + danger zone) | `<ComposedChart>` with `<Area>` + `<ReferenceLine>` |

**Recharts RTL note**: Recharts doesn't natively support RTL axis direction. Workaround: reverse data arrays and use `reversed` prop on `<XAxis>` for RTL charts. Arabic tick labels use `tickFormatter` returning Arabic numerals.

**Rationale**: Constitution supersedes all other practices. Recharts integrates cleanly with React Server/Client components and TanStack Query data patterns.

---

## 3. Supabase Schema Design

**Decision**: Extend the existing schema (projects, card_links) rather than replacing it. Add new tables for the missing entities.

**Existing tables confirmed in codebase**:
- `projects` (id, user_id, name, icon, type, budget_limit, created_at, updated_at)
- `card_links` (id, user_id, project_id, last4, created_at)
- `transactions` (id, user_id, project_id, amount, currency, merchant, date, created_at, updated_at) — *partially exists, needs columns added*

**New columns for `transactions` table** (migration):
- `status` TEXT DEFAULT 'pending' CHECK (status IN ('classified','pending','skipped'))
- `confidence_score` FLOAT CHECK (confidence_score BETWEEN 0 AND 1)
- `ai_reasoning` TEXT
- `payment_method_last4` TEXT
- `transaction_time` TIME
- `category_id` UUID REFERENCES spending_categories(id)
- `notes` TEXT

**New tables**:
- `classification_rules` — learned merchant → project mappings
- `spending_categories` — canonical category list (مطاعم, تسوق, مواصلات…)
- `debts` — owed_by_me and owed_to_me records
- `alerts` — smart alerts with type/action
- `chat_messages` — AI chat history
- `forecast_snapshots` — cached forecast results

**Row-Level Security (RLS)**: All tables require `auth.uid() = user_id` policies for SELECT, INSERT, UPDATE, DELETE. This is the existing pattern used by the projects table.

**Rationale**: Supabase PostgreSQL with RLS is the safest pattern for multi-user financial data. Extending existing tables avoids breaking the working 001-project-system feature.

---

## 4. TanStack Query Patterns for Financial UX

**Decision**: Use TanStack Query (already in QueryClientProvider) with optimistic updates for the classification review flow.

**Key patterns**:

1. **Dashboard data**: `useQuery(['dashboard'])` fetches aggregated data from `/api/dashboard`. Stale time: 60 seconds (balance doesn't change second-by-second).

2. **Classification Review — optimistic update**: When a user classifies a transaction:
   - Immediately remove it from the `pendingTransactions` cache (optimistic)
   - Fire `PATCH /api/transactions/:id/classify`
   - On error, roll back via `onError` and show toast

3. **Infinite scroll for transactions**: `useInfiniteQuery` on `/api/transactions?page=N&project=X` with cursor-based pagination.

4. **Mutations with invalidation**: After classify, invalidate `['dashboard']`, `['transactions', 'pending']`, and `['projects']` queries.

5. **Prefetching**: On hover over nav items, prefetch the page's primary query.

**Rationale**: Optimistic updates make the 30-second classification target (SC-003) achievable even on slower connections.

---

## 5. Layered Classification Architecture

**Decision**: Three-layer pipeline per Constitution III. Implemented in `/src/lib/classification.ts`.

```
Transaction arrives
        │
        ▼
Layer 1: Rules Engine
  SELECT project_id FROM classification_rules
  WHERE user_id = $1 AND merchant_pattern = LOWER($2)
  ─── match? → classify with confidence=1.0, skip layers 2+3
        │ no match
        ▼
Layer 2: User History
  SELECT project_id, COUNT(*) as freq
  FROM transactions
  WHERE user_id=$1 AND LOWER(merchant)=LOWER($2) AND status='classified'
  GROUP BY project_id ORDER BY freq DESC LIMIT 1
  ─── freq ≥ 3? → classify with confidence=(freq/(total+1)), skip layer 3
        │ insufficient history
        ▼
Layer 3: AI (OpenRouter)
  POST https://openrouter.ai/api/v1/chat/completions
  model: tencent/hy3-preview:free
  prompt: [user context + recent patterns + transaction details]
  ─── returns: {project_id, confidence, reasoning}
  ─── confidence ≥ 0.9? → auto-classify (silent)
  ─── confidence < 0.9? → add to pending queue for user review
```

**Auto-classify threshold**: 0.9 (configurable per user in settings). Below threshold → pending queue.

**Learning loop**: Every user classification confirmation → upsert into `classification_rules` if it becomes the dominant choice for that merchant.

**Rationale**: This matches Constitution III exactly and is the only compliant approach.

---

## 6. Knowledge Graph (Constitution IV)

**Decision**: Implement as a Supabase PostgreSQL view + materialized view, not a separate graph database.

**Graph connections**:
- Transactions ↔ Projects: via `project_id` FK
- Transactions ↔ Categories: via `category_id` FK
- Categories ↔ Patterns: via `classification_rules` (merchant_pattern → category → project)
- Patterns ↔ Projects: via `classification_rules.project_id`

**SQL View — `transaction_graph`**:
```sql
CREATE VIEW transaction_graph AS
SELECT
  t.id AS transaction_id,
  t.merchant,
  t.amount,
  t.status,
  t.confidence_score,
  p.id AS project_id,
  p.name AS project_name,
  p.type AS project_type,
  sc.id AS category_id,
  sc.name_ar AS category_name,
  cr.id AS rule_id
FROM transactions t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN spending_categories sc ON t.category_id = sc.id
LEFT JOIN classification_rules cr ON LOWER(t.merchant) = cr.merchant_pattern
  AND cr.user_id = t.user_id;
```

**Pattern detection** via SQL function `get_spending_patterns(user_id)` that queries the view and returns merchant frequency + category distribution.

**Rationale**: Supabase/PostgreSQL can represent the required graph relationships via views and FKs without adding a separate graph database dependency. This keeps the stack minimal per constitution simplicity principle.

---

## 7. AI Chat (OpenRouter)

**Decision**: Use OpenRouter API with `tencent/hy3-preview:free` model (constitution-mandated). Stream responses for a better chat UX.

**Implementation in `/src/lib/ai.ts`** (already exists — extend it):
- System prompt: Arabic financial assistant context with user's current balance, projects, and recent transactions
- Response format: JSON with `{ message: string, richCard?: RichCard }` where RichCard can be a transaction receipt or action chip set
- Streaming: use `ReadableStream` from OpenRouter's streaming endpoint, pipe through Next.js route handler with `TransformStream`

**Arabic language**: Set `"language": "ar"` hint in system prompt. The model supports Arabic natively.

**Context window management**: Send only the last 10 messages + current financial snapshot (balance, project budgets). Full history is stored in Supabase.

**Voice input (Constitution V)**: Web Speech API (`SpeechRecognition`) in `/src/lib/speech.ts` (already exists). Set `recognition.lang = 'ar-SA'` for Saudi Arabic. Transcribed text is sent as a regular chat message.

**Rationale**: OpenRouter free tier supports the required model. Streaming prevents timeout on longer responses. Arabic voice recognition requires `ar-SA` locale.

---

## 8. Forecast Algorithm

**Decision**: Rule-based statistical forecast (no ML model). Implemented server-side in `/src/lib/forecast.ts`.

**Algorithm**:
1. Compute 30-day rolling average income and expense from transaction history
2. Identify recurring transactions (same merchant, similar amount, ±3-day cadence) → mark as recurring events
3. Project balance forward using: `balance[t] = balance[t-1] + projected_income[t] - projected_expenses[t]`
4. Monte Carlo simulation (100 runs) with ±15% noise on non-recurring items → extract p15, p50, p85 for pessimistic/likely/optimistic
5. Danger zone: any day where p15 < configurable threshold (default 1000 SAR)

**Cache**: Store `forecast_snapshots` in Supabase with 6-hour TTL. Invalidate on new transaction classification.

**Rationale**: Statistical forecast is sufficient for the 30-day horizon. No external ML service dependency keeps the system simple and free.

---

## 9. App Router Page Structure Decision

**Decision**: Single shell layout with dynamic page content — NOT separate full-page routes per the prototype's JS tab switching.

```
src/app/
├── (shell)/
│   ├── layout.tsx              ← 3-column grid shell (sidebar + main + chat)
│   ├── page.tsx                ← Dashboard (لوحة التحكم)
│   ├── transactions/
│   │   └── page.tsx
│   ├── review/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   ├── forecast/
│   │   └── page.tsx
│   ├── debts/
│   │   └── page.tsx
│   ├── alerts/
│   │   └── page.tsx
│   ├── projects/
│   │   └── [id]/page.tsx       (existing)
│   └── settings/
│       └── page.tsx
└── api/
    └── ...
```

The sidebar and chat panel persist across all routes via the `(shell)/layout.tsx`. Client-side navigation via Next.js `<Link>` satisfies SC-001 (no full-page reload, sub-300ms transitions).

**Rationale**: App Router route groups enable persistent shell layouts while maintaining full URL addressability per page — better than the prototype's JS-based tab system.

---

## 10. NEEDS CLARIFICATION Resolutions

All resolved with informed defaults:

| Question | Resolution |
|---|---|
| Auto-classify confidence threshold | 0.90 (per prototype "90٪" in Settings page) |
| Forecast danger zone threshold | 1,000 SAR (per prototype alert text) |
| Supported payment sources | Bank card (last 4 digits) — manual entry only in v1; no bank API integration |
| Arabic number formatting | Use `Intl.NumberFormat('ar-SA')` for amounts; standard Western digits for confidence scores |
| Currency | SAR (ر.س) only in v1 |
| Chat history limit | Last 50 messages per session, persisted in Supabase |
| Voice input fallback | Text-only input on browsers without SpeechRecognition support (Firefox) |
| Debt payment recording | Records a transaction against the debt; does not create a bank transfer |
