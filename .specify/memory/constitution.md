<!--
Version change: initial → 1.0.0
Modified principles: All principles added (Arabic-First RTL UI, Single Project Transactions, Layered Classification, Knowledge Graph Integration, Core Voice Input)
Added sections: Technology Stack, Development Workflow
Removed sections: None
Templates requiring updates: None
Follow-up TODOs: None
-->

# Maliy Constitution

## Core Principles

### I. Arabic-First RTL UI

RTL by default, Arabic-first interface. Colors: --ink #0E1B2C / --paper #F4EFE6 / --amber #C8853A. Fonts: Reem Kufi for headings, Noto Naskh for body text, Fraunces for numbers. Chat-first interface with persistent sidebar and persistent chat panel.

### II. Single Project Transactions

Every transaction belongs to a single project.

### III. Layered Classification

Classification passes through 3 layers: Rules → User History → Claude API.

### IV. Knowledge Graph Integration

Knowledge Graph connects: Transactions ↔ Projects ↔ Categories ↔ Patterns.

### V. Core Voice Input

Voice input is a core feature, not an optional add-on, utilizing Web Speech API.

## Technology Stack

The required technology stack includes:

- Frontend: Next.js 14 + TypeScript
- Styling: Tailwind CSS
- State: TanStack Query
- Charts: Recharts
- AI: https://openrouter.ai/tencent/hy3-preview:free
- Voice: Web Speech API
- DB: Supabase (PostgreSQL)
- Auth: Supabase Auth

## Development Workflow

Code review requirements, testing gates, deployment approval process.

## Governance

Constitution supersedes all other practices. Amendments require documentation, approval, and migration plan. All PRs/reviews must verify compliance. Complexity must be justified.

**Version**: 1.0.0 | **Ratified**: 2026-04-29 | **Last Amended**: 2026-04-29
