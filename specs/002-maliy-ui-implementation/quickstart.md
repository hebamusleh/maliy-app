# Quickstart: ماليّ Full UI Implementation

**Feature**: 002-maliy-ui-implementation
**Date**: 2026-04-29

---

## Prerequisites

- Node.js 20+, pnpm (or npm)
- Supabase project with `.env.local` configured:
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  OPENROUTER_API_KEY=...
  ```

## 1. Database Migrations

Run the following against your Supabase project (SQL Editor or `supabase db push`):

### Step 1: Create `spending_categories` table and seed

```sql
-- See data-model.md § spending_categories
```

### Step 2: Extend `transactions` table

```sql
-- See data-model.md § transactions migration
```

### Step 3: Create new tables

```sql
-- classification_rules, debts, alerts, chat_messages, forecast_snapshots
-- See data-model.md for full DDL
```

### Step 4: Create views

```sql
-- transaction_graph, monthly_summary
-- See data-model.md § SQL Views
```

### Step 5: Enable RLS on all new tables

All new tables require RLS with `auth.uid() = user_id` policies.

---

## 2. Install New Dependencies

```bash
pnpm add recharts @types/recharts
pnpm add date-fns          # date formatting for charts
pnpm add react-hot-toast   # toast notifications
```

**Note**: Chart.js is NOT used. Recharts is the constitution-mandated charts library.

---

## 3. Font Setup (replace CDN with next/font)

Update `src/app/layout.tsx`:
```typescript
import { Reem_Kufi, Noto_Naskh_Arabic, Fraunces } from 'next/font/google'

const reemKufi = Reem_Kufi({ subsets: ['arabic'], variable: '--font-heading', weight: ['400','500','600','700'] })
const notoNaskh = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--font-body', weight: ['400','500','600','700'] })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-numbers', axes: ['opsz'], style: ['normal','italic'] })
```

---

## 4. Update `globals.css`

Add full design token set from prototype:
```css
:root {
  --ink: #0E1B2C; --ink-2: #142339; --ink-3: #1B2D48;
  --paper: #F4EFE6; --paper-2: #ECE5D7; --paper-3: #E2D9C6;
  --amber: #C8853A; --amber-2: #E0A050; --amber-soft: #F0CC85;
  --rose: #B85C5C; --sage: #6B8E6B;
  --line: rgba(14,27,44,0.12); --line-strong: rgba(14,27,44,0.22);
}
```

---

## 5. Page Structure

Create the route group:
```
src/app/(shell)/
├── layout.tsx              ← 3-column grid shell
├── page.tsx                ← Dashboard (move existing / replace)
├── transactions/page.tsx
├── review/page.tsx
├── analytics/page.tsx
├── forecast/page.tsx
├── debts/page.tsx
├── alerts/page.tsx
└── settings/page.tsx
```

---

## 6. Development Flow

```bash
pnpm dev         # Start dev server on http://localhost:3000
pnpm build       # Production build
pnpm lint        # ESLint + TypeScript check
pnpm test        # Jest unit tests
```

---

## 7. Implementation Order (Dependencies)

Build in this order to minimize blocked work:

1. **Design tokens + fonts** → globals.css, layout.tsx
2. **Layout shell** (Sidebar, ChatPanel stub, TopBar) → unblocks all pages
3. **Types** (extend src/types/project.ts, add src/types/index.ts)
4. **Database migrations** (enables API routes)
5. **Dashboard API** (`/api/dashboard`) + **Dashboard page**
6. **Transactions API** + **Transactions page** (list + filters)
7. **Classification pipeline** (`/src/lib/classification.ts`) + **Review page**
8. **Analytics API** + **Analytics page** (Recharts)
9. **Forecast lib** + **Forecast API** + **Forecast page**
10. **Debts API** + **Debts page**
11. **Alerts generation** + **Alerts API** + **Alerts page**
12. **Project detail pages** (update existing)
13. **Chat API** (streaming) + **ChatPanel** (full)
14. **Voice input** (Web Speech API)
15. **Settings page**
16. **CSV export**
17. **Mobile responsive** pass (1024px, 640px breakpoints)

---

## 8. Key Implementation Notes

### RTL in Tailwind
Use logical properties throughout:
- `ps-4` not `pl-4`
- `me-auto` not `mr-auto`
- `text-start` not `text-left`
- `border-s-4` not `border-l-4`

### Arabic Number Formatting
```typescript
const formatSAR = (n: number) =>
  new Intl.NumberFormat('ar-SA', { style: 'decimal', minimumFractionDigits: 0 }).format(n)
```

### Recharts RTL
For RTL axis in area/bar charts, reverse the data array and add `reversed` to `<XAxis>`.

### Classification Pipeline
Implement in `/src/lib/classification.ts` — called by `POST /api/transactions/:id/classify` and `POST /api/transactions/classify-bulk`. Must be testable in isolation.

### Chat Streaming
Use `ReadableStream` + `TransformStream` in the route handler. Client uses `EventSource` or fetch with streaming reader to consume SSE events.
