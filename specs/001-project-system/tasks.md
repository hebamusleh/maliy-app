---
description: "Task list template for feature implementation"
---

# Tasks: Project Management System

**Input**: Design documents from `/specs/001-project-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are not explicitly requested in the specification, so omitted per guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Set up Supabase project and configure environment variables in .env.local
- [ ] T002 Install required dependencies (Next.js, Supabase, TanStack Query, Recharts, Tailwind CSS) via npm
- [ ] T003 [P] Configure TypeScript types from contracts in src/types/project.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create database schema and tables in Supabase SQL editor from data-model.md
- [ ] T005 [P] Set up Supabase client and authentication provider in src/lib/supabase.ts
- [ ] T006 [P] Configure RTL layout and Arabic fonts in src/app/globals.css
- [ ] T007 Create base layout component with navigation in src/components/layout/Layout.tsx
- [ ] T008 Set up TanStack Query provider in src/app/layout.tsx
- [ ] T009 [P] Create reusable UI components (Button, Input, Card) in src/components/ui/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Financial Project (Priority: P1) 🎯 MVP

**Goal**: Allow users to create financial projects with name, icon, type, and budget limit

**Independent Test**: Create a project via the UI form and verify it appears in the projects list

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create ProjectForm component with validation in src/components/projects/ProjectForm.tsx
- [ ] T011 [US1] Create API route for creating projects in src/app/api/projects/route.ts
- [ ] T012 [US1] Create projects list page in src/app/projects/page.tsx
- [ ] T013 [US1] Add form submission handling and error display in ProjectForm.tsx
- [ ] T014 [US1] Implement project creation success feedback and navigation

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Link Bank Card to Project (Priority: P1)

**Goal**: Allow users to link bank cards to projects for automatic transaction assignment

**Independent Test**: Link a card's last 4 digits to a project and verify the association is stored

### Implementation for User Story 2

- [ ] T015 [P] [US2] Create CardLinkForm component in src/components/projects/CardLinkForm.tsx
- [ ] T016 [US2] Create API route for card linking in src/app/api/projects/[id]/cards/route.ts
- [ ] T017 [US2] Update project details page to show linked cards in src/app/projects/[id]/page.tsx
- [ ] T018 [US2] Add card linking validation and duplicate prevention
- [ ] T019 [US2] Implement card linking success feedback

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - View Project Dashboard (Priority: P1)

**Goal**: Display independent P&L, insights, and cash flow for each project

**Independent Test**: View a project's dashboard and verify P&L, insights, and cash flow data display correctly

### Implementation for User Story 3

- [ ] T020 [P] [US3] Create ProjectDashboard component in src/components/projects/ProjectDashboard.tsx
- [ ] T021 [P] [US3] Create utility functions for stats calculation in src/lib/project-stats.ts
- [ ] T022 [US3] Create API route for dashboard data in src/app/api/projects/[id]/dashboard/route.ts
- [ ] T023 [US3] Add Recharts P&L chart to dashboard
- [ ] T024 [US3] Add cash flow visualization with Recharts
- [ ] T025 [US3] Implement insights display and data fetching

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements, performance, and advanced features

- [ ] T026 [P] Set up Web Speech API for voice input in src/lib/speech.ts
- [ ] T027 [P] Configure OpenRouter AI client in src/lib/ai.ts
- [ ] T028 Add comprehensive error boundaries and error handling
- [ ] T029 Implement loading states and skeleton components
- [ ] T030 Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] T031 Performance optimization (lazy loading, memoization)
- [ ] T032 Add unit tests for critical components
- [ ] T033 Final RTL and Arabic localization polish

---

## Dependencies

**Story Completion Order**: US1 → US2 → US3 (US1 enables project creation needed for US2 and US3)

**Parallel Opportunities**:

- TypeScript types (T003) can be done in parallel with Supabase setup
- UI components (T009) can be done in parallel with layout setup
- Form components (T010, T015) can be developed in parallel
- Dashboard components (T020, T021) can be developed in parallel

**Examples**:

- Developer A: Setup (T001-T003) + Foundation (T004-T009) + US1 (T010-T014)
- Developer B: US2 (T015-T019) + US3 (T020-T025) + Polish (T026-T033)

## Implementation Strategy

**MVP Scope**: User Story 1 (project creation) - delivers core value of financial organization

**Incremental Delivery**:

1. **Week 1**: Setup + Foundation + US1 → Users can create and view projects
2. **Week 2**: US2 + US3 → Full project management with dashboards
3. **Week 3**: Polish → Production-ready with voice and AI features

**Risk Mitigation**: Each user story is independently testable, allowing rollback if issues arise

## Independent Test Criteria

**US1**: Can create project with all fields, appears in list, form validates input
**US2**: Can link card to project, association persists, prevents duplicates
**US3**: Dashboard shows accurate P&L and charts for project-specific data
