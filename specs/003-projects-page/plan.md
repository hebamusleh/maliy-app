# Implementation Plan: Unified Projects Page

**Branch**: `003-projects-page` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-projects-page/spec.md`

## Summary

Build a unified "Projects" page that replaces the fragmented Personal/Business/Freelance sidebar links with a single `/projects` route. Users can create, edit, and delete financial projects; each project has an independent dashboard showing P&L, cash flow, and AI insights scoped exclusively to its transactions. The entire feature works without authentication using a fallback anonymous user ID.

## Technical Context

**Language/Version**: TypeScript / Next.js 15 (App Router)
**Primary Dependencies**: TanStack Query v5, Tailwind CSS v4, Recharts, zod, react-hook-form, Supabase JS v2
**Storage**: Supabase (PostgreSQL) with no-auth fallback using `user_id = 'anon-user'`
**Testing**: Jest + React Testing Library (existing setup)
**Target Platform**: Web browser, RTL (Arabic), desktop-first
**Project Type**: Next.js fullstack web application
**Performance Goals**: Standard web app responsiveness; project list renders in < 500ms
**Constraints**: No auth flow — app must be fully usable without login; RTL layout throughout
**Scale/Scope**: Single-user local/demo deployment; < 100 projects, < 10,000 transactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Arabic-First RTL UI** | PASS | All new UI uses Arabic labels, RTL-aware layout, existing design tokens |
| **II. Single Project Transactions** | PASS | Feature enforces project_id as required on transaction creation |
| **III. Layered Classification** | N/A | Not in scope for this feature |
| **IV. Knowledge Graph Integration** | N/A | Not in scope for this feature |
| **V. Core Voice Input** | N/A | Not in scope for this feature |

All applicable gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-projects-page/
├── plan.md                    # This file
├── spec.md                    # Feature specification
├── research.md                # Phase 0 research decisions
├── data-model.md              # Entity definitions and relationships
├── quickstart.md              # How to run and test
├── tasks.md                   # Implementation tasks
├── contracts/
│   └── api-contracts.md       # API and component interface contracts
└── checklists/
    └── requirements.md        # Quality checklist
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── auth.ts                        # NEW: getRequestUser() no-auth helper
│   ├── supabase.ts                    # Existing — unchanged
│   └── project-stats.ts              # Existing — unchanged
│
├── types/
│   └── project.ts                     # MODIFY: CreateTransactionForm.project_id → required
│
├── app/
│   ├── (shell)/
│   │   ├── projects/
│   │   │   ├── page.tsx               # MOVE + REWRITE from src/app/projects/page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx           # MODIFY: add P&L + cash flow chart sections
│   │   └── (other pages unchanged)
│   │
│   └── api/
│       ├── projects/
│       │   ├── route.ts               # MODIFY: use getRequestUser() + spend aggregation
│       │   └── [id]/
│       │       ├── route.ts           # MODIFY: + add PATCH and DELETE handlers
│       │       ├── dashboard/
│       │       │   └── route.ts       # MODIFY: use getRequestUser()
│       │       └── cards/
│       │           ├── route.ts       # MODIFY: use getRequestUser(); relax constraint
│       │           └── [cardId]/
│       │               └── route.ts   # NEW: DELETE card link
│       ├── seed/
│       │   └── route.ts               # NEW: dev-only seed endpoint
│       └── (all other routes)         # MODIFY: replace auth guard with getRequestUser()
│
└── components/
    ├── projects/
    │   ├── ProjectForm.tsx            # MODIFY: add initialValues prop for edit mode
    │   ├── CardLinkForm.tsx           # Existing — unchanged
    │   ├── ProjectDetailHero.tsx      # Existing — unchanged
    │   ├── ProjectCard.tsx            # NEW: card with edit/delete/budget bar
    │   ├── ProjectPnLChart.tsx        # NEW: monthly income vs expenses bar chart
    │   └── ProjectCashFlowChart.tsx   # NEW: cumulative balance line chart
    │
    ├── layout/
    │   └── Sidebar.tsx                # MODIFY: single Projects link
    │
    └── transactions/
        └── AddTransactionModal.tsx    # MODIFY: project_id required + dropdown
```

**Structure Decision**: Single Next.js project with App Router. The `(shell)` route group is organizational only — it does not add a sub-layout. The root `src/app/layout.tsx` provides `ShellLayout` to all routes. The old `src/app/projects/page.tsx` (outside the shell group) is moved into `src/app/(shell)/projects/page.tsx` for consistency with all other shell pages.

## Complexity Tracking

No constitution violations. No unjustified complexity.

---

## Implementation Phases

### Phase A — No-Auth Foundation

**Goal**: Make the entire app work without authentication.

**A1** — Create `src/lib/auth.ts`:

```typescript
import { supabase } from './supabase';

export async function getRequestUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) return user;
  } catch {}
  return { id: 'anon-user' } as { id: string };
}
```

**A2** — Update all API routes that call `supabase.auth.getUser()`:
- Replace the auth check with `const user = await getRequestUser()`
- Remove the `if (authError || !user) return 401` guard
- Affected routes: `api/projects/route.ts`, `api/projects/[id]/route.ts`, `api/projects/[id]/dashboard/route.ts`, `api/projects/[id]/cards/route.ts`, `api/transactions/route.ts`, `api/transactions/[id]/classify/route.ts`, `api/transactions/export/route.ts`, `api/transactions/classify-bulk/route.ts`, `api/analytics/route.ts`, `api/dashboard/route.ts`, `api/forecast/route.ts`, `api/alerts/route.ts`, `api/alerts/[id]/dismiss/route.ts`, `api/debts/route.ts`, `api/debts/[id]/route.ts`, `api/debts/[id]/payment/route.ts`, `api/chat/route.ts`, `api/chat/messages/route.ts`

**A3** — Create `src/app/api/seed/route.ts` (dev only):
- Guard: `if (process.env.NODE_ENV === 'production') return 405`
- On POST: delete existing seed data for `anon-user`, then insert:
  - 3 projects: Personal `{ name: 'الشخصي', icon: '🏠', type: 'personal', budget_limit: 3000 }`, Business `{ name: 'عمل', icon: '💼', type: 'business', budget_limit: 10000 }`, Freelance `{ name: 'فريلانس', icon: '💻', type: 'freelance', budget_limit: 5000 }`
  - 6–8 transactions per project (mix of positive/negative amounts across last 3 months)

---

### Phase B — Projects CRUD API

**Goal**: Full CRUD for projects and card management.

**B1** — Add `PATCH /api/projects/[id]` to `src/app/api/projects/[id]/route.ts`:
- Accepts partial body: `name`, `icon`, `type`, `budget_limit`
- Validates each provided field (same rules as POST)
- Returns `{ project: updatedProject }`

**B2** — Add `DELETE /api/projects/[id]` to `src/app/api/projects/[id]/route.ts`:
- Step 1: `UPDATE transactions SET project_id = NULL WHERE project_id = :id AND user_id = :userId`
- Step 2: `DELETE FROM card_links WHERE project_id = :id AND user_id = :userId`
- Step 3: `DELETE FROM projects WHERE id = :id AND user_id = :userId`
- Returns `{ message: 'تم حذف المشروع' }`

**B3** — Relax card cross-project constraint in `src/app/api/projects/[id]/cards/route.ts`:
- Remove the `else` branch that returns 400 for cross-project duplicate cards
- Keep only the check for exact duplicates (same `project_id` + same `last4`)

**B4** — Create `src/app/api/projects/[id]/cards/[cardId]/route.ts`:
- `DELETE` handler: verifies `user_id` ownership, deletes the specific card link record

---

### Phase C — Sidebar Navigation Update

**Goal**: Single "Projects" nav item replacing three fragmented links.

**C1** — Update `src/components/layout/Sidebar.tsx`:
- Remove the `{ label: 'المشاريع', type: 'section' }` section header + three nav items (`/projects/personal`, `/projects/work`, `/projects/freelance`)
- Add one nav item in their place (between alerts and settings section):

```typescript
{
  page: '/projects',
  label: 'المشاريع',
  icon: (
    <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 7h18v13H3zM3 7l2-3h14l2 3" />
    </svg>
  ),
}
```

---

### Phase D — Projects List Page

**Goal**: Polished `/projects` page with per-card budget utilization and inline edit/delete.

**D1** — Create `src/components/projects/ProjectCard.tsx`:
- Props: `{ project: Project & { spend?: number }, onEdit: (p: Project) => void, onDelete: (id: string) => void }`
- Visual layout: project icon + name + type badge + budget progress bar (if `budget_limit` set) + edit/delete icon buttons
- Card click: `router.push('/projects/' + project.id)`; button clicks stop event propagation
- Delete: shows inline confirm (`'هل أنت متأكد؟'`) before calling `onDelete`
- Design: `background: var(--paper-2)`, `border: 1px solid var(--line)`, `border-radius: rounded-2xl`
- Budget bar: `var(--sage)` when < 85% used, `var(--rose)` when >= 85%

**D2** — Extend `src/components/projects/ProjectForm.tsx`:
- Add `initialValues?: Partial<CreateProjectForm>` prop
- Pass as `defaultValues` to `useForm`
- Heading: `initialValues ? 'تعديل المشروع' : 'إنشاء مشروع جديد'`

**D3** — Create `src/app/(shell)/projects/page.tsx` (replaces `src/app/projects/page.tsx`):
- `useQuery(['projects'])` fetches all projects with spend data
- `useState<Project | null>(null)` for the project being edited
- `useState(false)` for create form visibility
- Renders `ProjectCard` grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Create/edit form opens in an inline panel above the grid
- Empty state: "لا توجد مشاريع بعد" + create CTA button + seed data button
- After create/edit/delete: `queryClient.invalidateQueries({ queryKey: ['projects'] })`

**D4** — Delete `src/app/projects/page.tsx` (old file outside shell group)

**D5** — Extend `GET /api/projects` to include per-project spend:
- Run a grouped aggregation query: `SELECT project_id, SUM(ABS(amount)) as spend FROM transactions WHERE amount < 0 AND user_id = :userId GROUP BY project_id`
- Merge results into each project object: `{ ...project, spend, budget_used_pct }`

---

### Phase E — Per-Project Dashboard Enhancement

**Goal**: Add P&L and cash flow charts to the project detail page.

**E1** — Create `src/components/projects/ProjectPnLChart.tsx`:
- Props: `{ transactions: Transaction[] }`
- Uses `prepareChartData(transactions)` from `lib/project-stats.ts` → `{ month, income, expenses }[]`
- Recharts `<BarChart>`: income bars (`var(--sage)`), expenses bars (`var(--rose)`)
- Arabic X-axis month labels; RTL-aware legend
- Wrapped in `rounded-2xl` card, heading: "الأرباح والخسائر"

**E2** — Create `src/components/projects/ProjectCashFlowChart.tsx`:
- Props: `{ transactions: Transaction[] }`
- Derives running balance: sort transactions by date, compute cumulative `amount` sum
- Recharts `<LineChart>`: single line (`var(--amber-2)`), `<ReferenceLine y={0}>`
- Wrapped in `rounded-2xl` card, heading: "التدفق النقدي"

**E3** — Update `src/app/(shell)/projects/[id]/page.tsx`:
- Import and render `ProjectPnLChart` and `ProjectCashFlowChart`
- Place them between `ProjectDetailHero` and the insights section
- Pass `data.recent_transactions` to both components
- Conditionally render only when `recent_transactions.length > 0`

---

### Phase F — Transaction Project Assignment

**Goal**: Every new transaction must be assigned to a project.

**F1** — Update `src/types/project.ts`:
- Change `CreateTransactionForm.project_id` from `project_id?: string` to `project_id: string`

**F2** — Update `src/components/transactions/AddTransactionModal.tsx`:
- Add `useQuery(['projects'])` to load all projects
- Add a `<select>` field for `project_id` (required) above the other form fields
- Zod schema: `project_id: z.string().min(1, 'اختر مشروعاً')`
- Auto-select the first project when only one exists
- Style the select to match existing `Input` component look

---

## Post-Phase Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Arabic-First RTL UI** | PASS | All new components use Arabic text and RTL-safe Tailwind utilities |
| **II. Single Project Transactions** | PASS | `project_id` required in form; orphan-on-delete preserves transaction history |
| **III–V** | N/A | Not in scope |

---

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Spec | `specs/003-projects-page/spec.md` | Complete |
| Research | `specs/003-projects-page/research.md` | Complete |
| Data Model | `specs/003-projects-page/data-model.md` | Complete |
| API Contracts | `specs/003-projects-page/contracts/api-contracts.md` | Complete |
| Quickstart | `specs/003-projects-page/quickstart.md` | Complete |
| Tasks | `specs/003-projects-page/tasks.md` | Complete |
