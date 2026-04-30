# Tasks: Unified Projects Page

**Input**: Design documents from `specs/003-projects-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. No test tasks — not requested in the spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between them)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Create the no-auth helper that every subsequent task depends on.

- [ ] T001 Create `src/lib/auth.ts` exporting `getRequestUser()` — returns Supabase user when authenticated, or `{ id: 'anon-user' }` when auth is absent or fails

**Checkpoint**: `getRequestUser()` is importable and returns an object with `id` field in all cases.

---

## Phase 2: Foundational — No-Auth Migration

**Purpose**: Migrate every API route off the hard auth guard so the app runs without login.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — all API routes return 401 without it.

- [ ] T002 [P] Update `src/app/api/projects/route.ts`, `src/app/api/projects/[id]/route.ts`, `src/app/api/projects/[id]/dashboard/route.ts`, `src/app/api/projects/[id]/cards/route.ts` — replace `supabase.auth.getUser()` pattern with `const user = await getRequestUser()`, remove 401 guard
- [ ] T003 [P] Update `src/app/api/transactions/route.ts`, `src/app/api/transactions/[id]/classify/route.ts`, `src/app/api/transactions/export/route.ts`, `src/app/api/transactions/classify-bulk/route.ts` — same getRequestUser() migration
- [ ] T004 [P] Update `src/app/api/analytics/route.ts`, `src/app/api/dashboard/route.ts`, `src/app/api/forecast/route.ts`, `src/app/api/alerts/route.ts`, `src/app/api/alerts/[id]/dismiss/route.ts`, `src/app/api/debts/route.ts`, `src/app/api/debts/[id]/route.ts`, `src/app/api/debts/[id]/payment/route.ts`, `src/app/api/chat/route.ts`, `src/app/api/chat/messages/route.ts` — same getRequestUser() migration
- [ ] T005 Create `src/app/api/seed/route.ts` — dev-only POST endpoint (guards with `NODE_ENV === 'production'` check): deletes existing anon-user data then inserts 3 projects (`الشخصي`/🏠/personal/3000, `عمل`/💼/business/10000, `فريلانس`/💻/freelance/5000) plus 6–8 transactions per project with mix of positive/negative amounts dated across the last 3 months

**Checkpoint**: `GET /api/projects` returns `{ projects: [] }` without a Supabase session. `POST /api/seed` inserts test data.

---

## Phase 3: User Story 1 — Create a Financial Project (Priority: P1) 🎯 MVP

**Goal**: User can create a project with name, icon, type, budget limit, and linked bank card; project appears in a list at `/projects`.

**Independent Test**: Open `/projects`, click "إنشاء مشروع جديد", fill in name `فريلانس`, choose icon `💻`, select type "فريلانس", set budget 5000, submit → project appears as a card. Then open the project detail page.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Update `src/app/api/projects/[id]/cards/route.ts` — remove the `else` branch that returns 400 when a card is already linked to a *different* project; keep only the check for exact duplicates (`same project_id + same last4`)
- [ ] T007 [P] [US1] Create `src/app/api/projects/[id]/cards/[cardId]/route.ts` — DELETE handler that verifies `user_id` ownership and deletes the card link record
- [ ] T008 [US1] Extend `src/components/projects/ProjectForm.tsx` — add optional `initialValues?: Partial<CreateProjectForm>` prop; pass it as `defaultValues` to `useForm`; change heading to `initialValues ? 'تعديل المشروع' : 'إنشاء مشروع جديد'`
- [ ] T009 [US1] Create `src/app/(shell)/projects/page.tsx` — unified projects list page: `useQuery(['projects'])` for project list, `useState(false)` for create form visibility, render inline `ProjectForm` when open, render projects in a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` using the existing `Card` component (full `ProjectCard` component added in US2), empty state with "لا توجد مشاريع بعد" + "إنشاء مشروعك الأول" button + "إضافة بيانات تجريبية" button that calls `POST /api/seed`; invalidate `['projects']` query after create
- [ ] T010 [US1] Delete `src/app/projects/page.tsx` — the old projects page outside the shell group is now replaced by `src/app/(shell)/projects/page.tsx`

**Checkpoint**: User can navigate to `/projects`, create a project via the form, and see it appear in the list. Seed button populates example data.

---

## Phase 4: User Story 2 — Unified Projects View (Priority: P2)

**Goal**: All projects visible on a single page with type, icon, and budget utilization visible at a glance. Sidebar shows one "Projects" link instead of three type-specific links.

**Independent Test**: Run `POST /api/seed`, navigate to `/projects` — all 3 seeded projects appear on one page without switching tabs. Each card shows name, icon, type label, and budget usage bar. Sidebar has a single "المشاريع" link.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Extend GET handler in `src/app/api/projects/route.ts` — after fetching projects, run a grouped aggregation: `SELECT project_id, SUM(ABS(amount)) as spend FROM transactions WHERE amount < 0 AND user_id = :userId GROUP BY project_id`; merge `spend` and `budget_used_pct` into each project object in the response
- [ ] T012 [P] [US2] Update `src/components/layout/Sidebar.tsx` — remove the `{ label: 'المشاريع', type: 'section' }` header and three nav items (`/projects/personal`, `/projects/work`, `/projects/freelance`); add a single nav item `{ page: '/projects', label: 'المشاريع', icon: <folder SVG> }` in their place between the alerts item and the "إعدادات" section header
- [ ] T013 [US2] Create `src/components/projects/ProjectCard.tsx` — props: `{ project: Project & { spend?: number }, onEdit: (p: Project) => void, onDelete: (id: string) => void }`; card layout: project icon + name + type badge; if `budget_limit` set, show spend/budget text and progress bar (color: `var(--sage)` below 85%, `var(--rose)` at/above 85%); edit (pencil) and delete (trash) icon buttons that stop event propagation; clicking the card navigates to `/projects/[id]`; delete shows inline Arabic confirm before calling `onDelete`; style: `background: var(--paper-2)`, `border: 1px solid var(--line)`, `border-radius: rounded-2xl`, font/color tokens matching existing components
- [ ] T014 [US2] Update `src/app/(shell)/projects/page.tsx` — replace the plain `Card` rendering loop with `ProjectCard` components; pass `onEdit` that sets a `useState<Project | null>` to open `ProjectForm` in edit mode with `initialValues`; pass `onDelete` that calls `DELETE /api/projects/:id` and invalidates `['projects']` on success; pass spend data from the enhanced GET response

**Checkpoint**: All projects visible on one page as styled cards with budget bars. Sidebar has single Projects link. Edit/delete UI visible (backing API wired in US5).

---

## Phase 5: User Story 3 — Per-Project Dashboard (Priority: P3)

**Goal**: Clicking a project shows an independent dashboard with P&L bar chart, cash flow line chart, AI insights, and recent transactions — all scoped to that project only.

**Independent Test**: Seed data → open a project dashboard → verify P&L chart shows monthly income vs expenses bars; cash flow chart shows running balance line; insights reflect only that project's transactions; changing to another project shows different data.

### Implementation for User Story 3

- [ ] T015 [P] [US3] Create `src/components/projects/ProjectPnLChart.tsx` — props: `{ transactions: Transaction[] }`; call `prepareChartData(transactions)` from `src/lib/project-stats.ts` to get `{ month, income, expenses }[]`; render Recharts `<BarChart>` with two `<Bar>` series (income: `var(--sage)`, expenses: `var(--rose)`); Arabic X-axis month labels; `<Tooltip>` and `<Legend>` in Arabic; wrap in `rounded-2xl` card with heading "الأرباح والخسائر"
- [ ] T016 [P] [US3] Create `src/components/projects/ProjectCashFlowChart.tsx` — props: `{ transactions: Transaction[] }`; derive running balance by sorting transactions by date and computing cumulative sum of `amount`; render Recharts `<LineChart>` with single `<Line>` (stroke: `var(--amber-2)`); add `<ReferenceLine y={0}>` for break-even reference; wrap in `rounded-2xl` card with heading "التدفق النقدي"
- [ ] T017 [US3] Update `src/app/(shell)/projects/[id]/page.tsx` — import `ProjectPnLChart` and `ProjectCashFlowChart`; render them between `ProjectDetailHero` and the insights section; pass `data.recent_transactions` to both; conditionally render both charts only when `recent_transactions.length > 0`

**Checkpoint**: Opening `/projects/[id]` for a seeded project shows P&L bar chart, cash flow line chart, AI insights, and transaction list — all containing only data from that project.

---

## Phase 6: User Story 4 — Assign Transaction to Project (Priority: P4)

**Goal**: Every new transaction is required to have a project assigned. No unassigned transactions can be created through the UI.

**Independent Test**: Open Transactions page → click add transaction → "اختر المشروع" field is present, required, and pre-populated with available projects → submit without selecting a project shows validation error; submit with a project → transaction appears in that project's dashboard and not in other projects.

### Implementation for User Story 4

- [ ] T018 [US4] Update `src/types/project.ts` — change `CreateTransactionForm.project_id` from `project_id?: string` to `project_id: string` (required field)
- [ ] T019 [US4] Update `src/components/transactions/AddTransactionModal.tsx` — add `useQuery(['projects'])` hook to load all projects; add a required `<select>` field for `project_id` above the other form fields with label "المشروع"; update zod schema: `project_id: z.string().min(1, 'اختر مشروعاً')`; auto-select the first project when the list contains exactly one project; style the select element to match the existing `Input` component appearance using the same CSS variables

**Checkpoint**: Adding a transaction requires selecting a project. The created transaction appears in that project's dashboard and not in others.

---

## Phase 7: User Story 5 — Edit or Delete a Project (Priority: P5)

**Goal**: Users can update a project's name, icon, type, or budget limit, and delete a project (its transactions are retained as unassigned).

**Independent Test**: Open `/projects` → edit "عمل" project name to "عمل 2024" → save → card updates immediately. Then delete "الشخصي" project → it disappears from the list; navigate to transactions → those transactions still exist but have no project assigned.

### Implementation for User Story 5

- [ ] T020 [US5] Add PATCH handler to `src/app/api/projects/[id]/route.ts` — accepts partial body `{ name?, icon?, type?, budget_limit? }`; validates each provided field with same rules as POST; runs `UPDATE projects SET ... WHERE id = :id AND user_id = :userId`; returns `{ project: updatedProject }`
- [ ] T021 [US5] Add DELETE handler to `src/app/api/projects/[id]/route.ts` — step 1: `UPDATE transactions SET project_id = NULL WHERE project_id = :id AND user_id = :userId`; step 2: `DELETE FROM card_links WHERE project_id = :id AND user_id = :userId`; step 3: `DELETE FROM projects WHERE id = :id AND user_id = :userId`; returns `{ message: 'تم حذف المشروع' }`
- [ ] T022 [US5] Wire edit flow in `src/app/(shell)/projects/page.tsx` — `onEdit` callback sets `editingProject` state; renders `ProjectForm` with `initialValues={editingProject}` above the grid; `onSubmit` calls `PATCH /api/projects/:id`; on success closes form and invalidates `['projects']` query
- [ ] T023 [US5] Wire delete flow in `src/app/(shell)/projects/page.tsx` — `onDelete` callback calls `DELETE /api/projects/:id`; on success shows success toast and invalidates `['projects']` query; error shows error toast

**Checkpoint**: Edit saves changes and updates the card immediately. Delete removes the project; transactions remain visible in the Transactions page without a project.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Consistency, loading states, and final validation.

- [ ] T024 [P] Add loading and error states to `src/app/(shell)/projects/page.tsx` — show skeleton loaders (matching pattern in other shell pages) during query loading; show error message with "حاول مرة أخرى" retry button on query failure
- [ ] T025 [P] Audit RTL layout across all new components — verify `ms-*`/`me-*` instead of `ml-*`/`mr-*` in `ProjectCard.tsx`, `ProjectPnLChart.tsx`, `ProjectCashFlowChart.tsx`; verify `font-heading`, `font-numbers` classes; verify `var(--ink)`, `var(--paper)`, `var(--amber)` tokens are used consistently
- [ ] T026 Validate full quickstart.md flow end-to-end: seed data → create project → link card → add transaction with project → view per-project dashboard (verify charts and insights) → edit project name → delete a project → confirm transaction survives deletion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 3 (needs the projects page to exist at `/projects`)
- **US3 (Phase 5)**: Depends on Phase 3 (needs a project + its transactions)
- **US4 (Phase 6)**: Depends on Phase 2 (needs getRequestUser in transactions route) and Phase 3 (needs projects list for dropdown)
- **US5 (Phase 7)**: Depends on Phase 3 and Phase 4 (edit/delete UI is in the projects page)
- **Polish (Phase 8)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on other stories.
- **US2 (P2)**: Starts after US1 (the page created in US1 is enhanced in US2).
- **US3 (P3)**: Starts after US1 (needs a project dashboard page + transactions).
- **US4 (P4)**: Starts after Phase 2 + US1 (needs projects list for dropdown).
- **US5 (P5)**: Starts after US1 + US2 (edit/delete wired into the projects page).

### Within Each User Story

- Models/types before services/API
- API endpoints before UI components
- Components before page integration
- [P] tasks within a phase can be implemented simultaneously

### Parallel Opportunities

- T002, T003, T004 (no-auth migration): all touch different files — parallelizable
- T006, T007 (US1): different files — parallelizable
- T011, T012 (US2): different files — parallelizable
- T015, T016 (US3): different files — parallelizable
- T020, T021 are in the same file — do T020 first, then T021
- T024, T025 (polish): different concerns — parallelizable

---

## Parallel Examples

### Phase 2 — No-Auth Migration (3 parallel tracks)

```
Track A: T002 — projects API routes
Track B: T003 — transactions API routes
Track C: T004 — all other API routes
         T005 — seed endpoint (after T002)
```

### Phase 4 — US2 (2 parallel tracks then sequential)

```
Track A: T011 — extend GET /api/projects with spend data
Track B: T012 — sidebar update

→ then T013 (ProjectCard) → T014 (wire into page)
```

### Phase 5 — US3 (2 parallel tracks then sequential)

```
Track A: T015 — ProjectPnLChart
Track B: T016 — ProjectCashFlowChart

→ then T017 (wire both into [id] page)
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1–3)

1. Complete Phase 1: Create `src/lib/auth.ts`
2. Complete Phase 2: Migrate all API routes to no-auth (T002–T005)
3. Complete Phase 3: US1 — create project + basic list page (T006–T010)
4. **STOP and VALIDATE**: Can create a project and see it listed. Seed data works.
5. Demo-ready: basic project creation functional

### Incremental Delivery

1. Phase 1–2: Foundation → App runs without login
2. Phase 3 (US1): Create projects → Functional MVP
3. Phase 4 (US2): Unified view + sidebar → Polished MVP
4. Phase 5 (US3): Dashboard charts → Financial insights visible
5. Phase 6 (US4): Transaction assignment → Data separation enforced
6. Phase 7 (US5): Edit/Delete → Full CRUD
7. Phase 8: Polish → Production-ready

---

## Notes

- `[P]` tasks = different files, no blocking dependencies between them
- `[Story]` label traces each task back to its spec user story
- Design tokens to use throughout: `var(--ink)`, `var(--paper)`, `var(--paper-2)`, `var(--amber)`, `var(--amber-2)`, `var(--rose)`, `var(--sage)`, `var(--line)`
- RTL spacing: always use `ms-*`/`me-*` (margin-start/end) not `ml-*`/`mr-*`
- Font classes: `font-heading` (Reem Kufi), `font-numbers` (Fraunces), body is default (Noto Naskh)
- After each task or logical group, verify the targeted user story's independent test criteria
- The old `src/app/projects/page.tsx` (T010) must be deleted — keeping it creates a routing conflict with the new `src/app/(shell)/projects/page.tsx`
