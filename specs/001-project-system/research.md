# Research Findings: Project Management System

**Date**: 2026-04-29
**Feature**: specs/001-project-system/spec.md

## Decisions Made

### Decision: Testing Framework

**Rationale**: Jest provides robust unit testing for TypeScript/React components, React Testing Library ensures accessible component testing, and they integrate well with Next.js. This choice supports the constitution's emphasis on test-first development.
**Alternatives Considered**: Vitest (faster but less mature), Cypress (e2e only, not suitable for unit tests).
**Impact**: Enables reliable testing of project creation, card linking, and dashboard rendering.

### Decision: Performance Benchmarks

**Rationale**: Dashboard load <2s ensures good UX for financial data, project creation <1s provides instant feedback, project switch <500ms enables smooth navigation between projects.
**Alternatives Considered**: Stricter (<1s load) but not necessary for MVP, looser (>3s) but would hurt UX.
**Impact**: Guides optimization efforts and sets measurable goals.

### Decision: Scale Assumptions

**Rationale**: 100 projects per user covers freelancers with multiple clients, 1000 transactions per project supports active projects, 1000 concurrent users is realistic for initial launch.
**Alternatives Considered**: Lower limits (10 projects) too restrictive, higher (1000 projects) overkill for MVP.
**Impact**: Informs database design and query optimization.

### Decision: Next.js 14 Best Practices

**Rationale**: Use App Router for modern routing, Server Components for performance, Client Components only when needed (forms, interactivity). TanStack Query for server state management.
**Alternatives Considered**: Pages Router (legacy), SWR (similar to TanStack Query).
**Impact**: Ensures scalable, performant architecture.

### Decision: Supabase Integration Patterns

**Rationale**: Use Supabase Auth for user management, PostgreSQL for data storage, real-time subscriptions for live updates. Row Level Security (RLS) for data isolation.
**Alternatives Considered**: Direct PostgreSQL (more complex), Firebase (less flexible).
**Impact**: Provides secure, real-time financial data management.

### Decision: RTL Arabic UI Implementation

**Rationale**: Use Tailwind's RTL support, custom fonts loaded via Next.js, dir="rtl" on root elements. Test with Arabic content.
**Alternatives Considered**: CSS logical properties (less browser support), manual RTL flipping.
**Impact**: Ensures proper Arabic-first experience.

### Decision: Web Speech API Integration

**Rationale**: Use browser's native Web Speech API for voice input, fallback to text input. Handle Arabic speech recognition.
**Alternatives Considered**: Third-party services (cost, complexity), no voice (violates constitution).
**Impact**: Enables core voice input feature.

### Decision: OpenRouter AI Usage

**Rationale**: Use https://openrouter.ai/tencent/hy3-preview:free for AI features, implement rate limiting and error handling.
**Alternatives Considered**: Direct Claude API (constitution specifies Claude, but arguments override for this feature).
**Impact**: Provides AI capabilities for future transaction classification.

### Decision: Recharts for Financial Charts

**Rationale**: Recharts provides responsive, accessible charts suitable for financial data visualization.
**Alternatives Considered**: Chart.js (heavier), D3 (more complex).
**Impact**: Enables clear P&L and cash flow visualization.
