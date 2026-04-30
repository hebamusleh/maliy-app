# Research: Unified Projects Page

**Feature**: 003-projects-page
**Date**: 2026-04-30

---

## Decision 1: No-Auth Data Layer Strategy

**Decision**: Use a hardcoded fallback user ID (`ANON_USER_ID = 'anon-user'`) in a shared auth helper. All API routes call `getRequestUser()` which returns the Supabase user when authenticated, or the fallback ID when auth is absent. No code duplication; all existing API route logic stays the same.

**Rationale**: The spec requires zero auth friction — any user opens the app and it works. The minimal-change approach is a single helper function that wraps `supabase.auth.getUser()` and falls back gracefully. This avoids rewriting the entire API layer or introducing a second storage system.

**Alternatives Considered**:
- Full in-memory/Zustand store (no API routes) — more complex, diverges from architecture
- Next.js middleware to inject a session — overengineered for this phase
- Separate mock API routes — duplication

**Open Question Resolved**: The fallback user ID `'anon-user'` is a string constant. Supabase RLS policies will need to either be disabled or set to `true` for this user. For local dev without a live Supabase instance, API routes will return empty arrays/objects on DB failure — the UI handles empty states gracefully.

---

## Decision 2: Seed Data

**Decision**: Create a `POST /api/seed` route that inserts a predefined set of projects and transactions for `ANON_USER_ID`. This route is only active when `NODE_ENV !== 'production'`. A "Seed Data" button can be added to the Projects empty state or Settings page.

**Rationale**: Without seed data, the projects page will always show the empty state. A simple seed route allows testers and reviewers to populate the app with realistic data instantly.

**Alternatives Considered**:
- Hardcoded static arrays returned by API routes — breaks real Supabase integration
- SQL seed file — requires DB access; not user-friendly for quick testing

---

## Decision 3: Route Structure — Move Projects Page into (shell) Group

**Decision**: Move `src/app/projects/page.tsx` → `src/app/(shell)/projects/page.tsx`. The `[id]` page already lives in `(shell)/projects/[id]/page.tsx`.

**Rationale**: The `(shell)` route group co-locates all application pages. Having the projects list outside `(shell)` while `[id]` is inside creates an inconsistency. Moving it into `(shell)` keeps the URL at `/projects` (route groups don't affect URLs) and makes the file structure consistent.

**Note**: The old `src/app/projects/page.tsx` will be deleted and replaced.

---

## Decision 4: Card Multi-Project Policy

**Decision**: Allow a single bank card (last 4 digits) to be linked to multiple projects. Update the card-link API to only reject exact duplicates (same card + same project), not cross-project links.

**Rationale**: The spec assumption explicitly states "A single bank card (by last 4 digits) may be linked to multiple projects simultaneously." The current API enforces a one-card-one-project constraint, which contradicts this. Removing the cross-project check is a one-line change.

---

## Decision 5: Project Edit/Delete

**Decision**: Add `PATCH /api/projects/[id]` and `DELETE /api/projects/[id]` endpoints. Delete sets `project_id = null` on orphaned transactions (soft unlink) rather than deleting them. Edit updates name, icon, type, and budget_limit.

**Rationale**: Users need to maintain their projects over time. Deleting transactions on project delete would cause data loss. Setting `project_id = null` preserves financial history while cleanly removing the project container.

---

## Decision 6: Sidebar Navigation

**Decision**: Replace the "المشاريع" section with links to `/projects/personal`, `/projects/work`, `/projects/freelance` → replace with a single "المشاريع" nav item linking to `/projects`.

**Rationale**: The feature spec requires a single unified page. The current sidebar has three separate project-type links pointing to pages that don't exist. These will be replaced by one "Projects" link.

---

## Decision 7: Per-Project Dashboard Enhancements

**Decision**: Extend the existing `(shell)/projects/[id]/page.tsx` with a P&L bar chart and a cash flow line chart, both scoped to the project's transactions. Reuse the existing `prepareChartData()` from `lib/project-stats.ts` for the P&L chart. Reuse `CashFlowChart` component with filtered data.

**Rationale**: The spec requires P&L, insights, and cash flow per project. The dashboard page already has insights and transactions. Adding the two chart components reuses existing infrastructure rather than building new ones.

---

## Decision 8: Transaction Project Assignment

**Decision**: Update `AddTransactionModal` to make `project_id` a required field (not optional). Show a project dropdown populated via `useQuery(['projects'])`. Ensure `CreateTransactionForm.project_id` is required in the form schema.

**Rationale**: The spec states "every transaction MUST be assigned to exactly one project." Currently `project_id` is optional. Making it required in the form is the minimal change needed.
