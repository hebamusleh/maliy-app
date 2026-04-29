# Implementation Plan: ماليّ Full UI Implementation

**Branch**: `main` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-maliy-ui-implementation/spec.md`

---

## Summary

Implement the full ماليّ financial management application UI and backend, matching the visual design and functionality of `prototype.html`. The implementation extends the existing Next.js 14 + Supabase codebase (001-project-system) with: 10 application pages, 15+ API routes, a 3-layer AI classification pipeline, Recharts-powered charts, an Arabic AI chat assistant with streaming, and a rule-based 30-day financial forecast engine.

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 (Next.js 14 App Router)
**Primary Dependencies**: Next.js 14, Tailwind CSS v4, TanStack Query v5, Recharts 2, Supabase JS v2, OpenRouter API (`tencent/hy3-preview:free`), Web Speech API
**Storage**: Supabase PostgreSQL (existing project) — extended with 6 new tables + 2 SQL views
**Testing**: Jest + React Testing Library (existing setup)
**Target Platform**: Web (desktop-first, responsive to 375px)
**Project Type**: Full-stack web application (Next.js monolith)
**Performance Goals**: Page render < 1.5s, API response < 500ms (SC-001, SC-002, SC-006)
**Constraints**: RTL Arabic throughout, SAR currency only, Web Speech API voice input, single-tenant Supabase session auth
**Scale/Scope**: Single user per session, up to 1,000 transactions/user, 10+ screens

---

## Constitution Check

*GATE: Verified before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Notes |
|---|---|---|
| I. Arabic-First RTL UI | ✅ PASS | `lang="ar" dir="rtl"` in layout, RTL Tailwind utilities, Arabic fonts via `next/font` |
| II. Single Project Transactions | ✅ PASS | `project_id` FK on transactions; nullable only while pending classification |
| III. Layered Classification | ✅ PASS | Rules → User History → AI (OpenRouter) pipeline in `/src/lib/classification.ts` |
| IV. Knowledge Graph Integration | ✅ PASS | `transaction_graph` SQL view linking Transactions ↔ Projects ↔ Categories ↔ Patterns |
| V. Core Voice Input | ✅ PASS | Web Speech API in `/src/lib/speech.ts`, `lang='ar-SA'`, integrated into ChatComposer |
| Tech Stack: Charts | ✅ PASS | **Recharts** used (not Chart.js from prototype — prototype is reference only) |
| Tech Stack: AI | ✅ PASS | OpenRouter `tencent/hy3-preview:free` |
| Tech Stack: State | ✅ PASS | TanStack Query with optimistic updates for review flow |

**No violations.** Complexity tracking table not required.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-maliy-ui-implementation/
├── plan.md                        ← This file
├── spec.md                        ← Feature specification
├── research.md                    ← Phase 0 research findings
├── data-model.md                  ← Database schema + TypeScript types
├── quickstart.md                  ← Setup and implementation guide
├── contracts/
│   ├── api-contracts.md           ← REST API endpoint contracts
│   └── component-contracts.md    ← React component prop interfaces
├── checklists/
│   └── requirements.md           ← Quality checklist
└── tasks.md                       ← Phase 2 output (/speckit-tasks command)
```

### Source Code

```text
src/
├── app/
│   ├── (shell)/
│   │   ├── layout.tsx             ← 3-column shell (Sidebar + Main + ChatPanel)
│   │   ├── page.tsx               ← Dashboard (لوحة التحكم)
│   │   ├── transactions/
│   │   │   └── page.tsx           ← Transactions list
│   │   ├── review/
│   │   │   └── page.tsx           ← Classification review queue
│   │   ├── analytics/
│   │   │   └── page.tsx           ← Analytics
│   │   ├── forecast/
│   │   │   └── page.tsx           ← Forecast
│   │   ├── debts/
│   │   │   └── page.tsx           ← Debts & obligations
│   │   ├── alerts/
│   │   │   └── page.tsx           ← Smart alerts
│   │   ├── projects/
│   │   │   └── [id]/page.tsx      ← Project detail (update existing)
│   │   └── settings/
│   │       └── page.tsx           ← Settings
│   ├── api/
│   │   ├── dashboard/route.ts
│   │   ├── transactions/
│   │   │   ├── route.ts           ← GET list + POST create
│   │   │   ├── export/route.ts    ← GET CSV download
│   │   │   ├── classify-bulk/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts       ← PATCH + DELETE
│   │   │       └── classify/route.ts
│   │   ├── analytics/route.ts
│   │   ├── forecast/route.ts
│   │   ├── debts/
│   │   │   ├── route.ts           ← GET + POST
│   │   │   └── [id]/
│   │   │       ├── route.ts       ← PATCH + DELETE
│   │   │       └── payment/route.ts
│   │   ├── alerts/
│   │   │   ├── route.ts           ← GET
│   │   │   └── [id]/dismiss/route.ts
│   │   ├── chat/
│   │   │   ├── route.ts           ← POST (streaming)
│   │   │   └── messages/route.ts  ← GET history
│   │   └── classification/
│   │       └── rules/route.ts     ← GET + DELETE
│   ├── layout.tsx                 ← Root layout (fonts, html/body)
│   └── globals.css                ← Full design token set
│
├── components/
│   ├── layout/
│   │   ├── Layout.tsx             ← Update: 3-col grid shell
│   │   ├── Sidebar.tsx            ← New: full sidebar
│   │   ├── TopBar.tsx             ← New
│   │   └── ChatPanel.tsx          ← New
│   ├── dashboard/
│   │   ├── BalanceCard.tsx
│   │   ├── ReviewBanner.tsx
│   │   ├── ProjectSummaryCards.tsx
│   │   ├── CashFlowChart.tsx      ← Recharts AreaChart
│   │   └── AlertsPreview.tsx
│   ├── transactions/
│   │   ├── TransactionList.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── TransactionFilters.tsx
│   │   ├── TransactionDetailModal.tsx
│   │   └── AddTransactionModal.tsx
│   ├── review/
│   │   ├── ReviewQueue.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── ProjectChoicePicker.tsx
│   │   └── ReviewProgressPips.tsx
│   ├── analytics/
│   │   ├── StatGrid.tsx
│   │   ├── CategoryBreakdown.tsx
│   │   ├── ProjectDistributionChart.tsx  ← Recharts PieChart
│   │   └── DailySpendChart.tsx           ← Recharts BarChart
│   ├── forecast/
│   │   ├── ForecastScenarios.tsx
│   │   ├── ForecastChart.tsx             ← Recharts ComposedChart
│   │   └── UpcomingEvents.tsx
│   ├── debts/
│   │   ├── DebtOverview.tsx
│   │   ├── DebtCard.tsx
│   │   └── AddDebtModal.tsx
│   ├── alerts/
│   │   ├── AlertTabs.tsx
│   │   ├── AlertItem.tsx
│   │   └── AlertList.tsx
│   ├── chat/
│   │   ├── ChatSidebar.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatComposer.tsx
│   │   ├── RichCardRenderer.tsx
│   │   └── VoiceInput.tsx
│   ├── projects/
│   │   ├── ProjectDetailHero.tsx  ← New
│   │   └── (existing components)
│   └── ui/
│       ├── ConfidenceMeter.tsx    ← New shared component
│       ├── SilentConfirm.tsx      ← New
│       └── (existing: Button, Card, Input)
│
├── lib/
│   ├── supabase.ts                ← Existing (no changes)
│   ├── ai.ts                      ← Extend: OpenRouter streaming chat
│   ├── speech.ts                  ← Existing (set lang=ar-SA)
│   ├── classification.ts          ← New: 3-layer pipeline
│   ├── forecast.ts                ← New: rule-based forecast algorithm
│   ├── analytics.ts               ← New: aggregation helpers
│   └── error-handler.ts           ← Existing
│
└── types/
    ├── project.ts                 ← Extend: add status, confidence fields to Transaction
    └── index.ts                   ← New: Debt, Alert, ChatMessage, Forecast, Analytics types
```

**Structure Decision**: Next.js App Router with `(shell)` route group for the persistent 3-column layout. All new pages live inside `(shell)` so Sidebar and ChatPanel persist without re-mounting during navigation. API routes follow REST conventions under `/api/`.

---

## Complexity Tracking

No constitution violations requiring justification.
