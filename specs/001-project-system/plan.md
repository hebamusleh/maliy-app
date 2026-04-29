# Implementation Plan: Project Management System

**Branch**: `001-project-system` | **Date**: 2026-04-29 | **Spec**: specs/001-project-system/spec.md
**Input**: Feature specification from `/specs/001-project-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build the core project management system allowing freelancers and small business owners in MENA to create multiple financial projects (personal, business, freelance), link bank cards to projects, and view independent dashboards with P&L, insights, and cash flow. Technical approach: Next.js 14 web application with TypeScript, Tailwind CSS for RTL Arabic-first UI, TanStack Query for state management, Recharts for charts, Supabase for PostgreSQL database and auth, Web Speech API for voice input, and OpenRouter AI for intelligent features.

## Technical Context

**Language/Version**: TypeScript (Next.js 14)  
**Primary Dependencies**: Next.js 14, TanStack Query, Recharts, Supabase client  
**Storage**: Supabase PostgreSQL  
**Testing**: Jest + React Testing Library  
**Target Platform**: Web browsers (Chrome, Firefox, Safari)  
**Project Type**: Single-page web application  
**Performance Goals**: Dashboard load <2s, project creation <1s, project switch <500ms  
**Constraints**: RTL Arabic-first interface, voice input support, real-time data updates  
**Scale/Scope**: 100 projects per user, 1000 transactions per project, 1000 concurrent users

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Arabic-First RTL UI**: Satisfied - RTL layout, Arabic fonts (Reem Kufi, Noto Naskh, Fraunces), chat-first interface
- **Single Project Transactions**: Satisfied - every transaction belongs to exactly one project
- **Layered Classification**: Not applicable for this feature (transaction classification in future specs)
- **Knowledge Graph Integration**: Not applicable for this feature (graph in future specs)
- **Core Voice Input**: Satisfied - Web Speech API integration planned

No violations detected. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── projects/
│   │   ├── page.tsx          # Projects list page
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Project dashboard
│   │   │   └── layout.tsx
│   │   └── create/
│   │       └── page.tsx      # Create project
│   ├── api/
│   │   └── projects/
│   │       ├── route.ts       # Projects API
│   │       └── [id]/
│   │           ├── route.ts   # Project CRUD
│   │           └── cards/
│   │               └── route.ts # Card linking
│   └── globals.css
├── components/
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── ProjectDashboard.tsx
│   │   └── CardLinkForm.tsx
│   └── ui/                    # Reusable UI components
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── queries.ts            # TanStack Query hooks
│   └── utils.ts
└── types/
    └── project.ts            # TypeScript types
```
