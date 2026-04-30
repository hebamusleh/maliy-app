# Quickstart: Unified Projects Page

**Feature**: 003-projects-page
**Date**: 2026-04-30

---

## Prerequisites

- Node.js 18+ installed
- `npm install` (or `pnpm install`) completed
- `.env.local` present (Supabase vars optional — app works without them in no-auth mode)

---

## Running the App (No Auth Required)

```bash
npm run dev
```

Open `http://localhost:3000`. No login needed — the app uses a fallback anonymous user.

---

## Seeding Test Data

Once the app is running, visit the Projects page. If no projects exist, click **"إضافة بيانات تجريبية"** (Seed Data button in empty state), or call the seed endpoint directly:

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates 3 projects (Personal, Business, Freelance) with 20 sample transactions across the last 3 months.

---

## Key URLs

| URL | Description |
|-----|-------------|
| `/` | Main dashboard |
| `/projects` | Unified projects list (this feature) |
| `/projects/[id]` | Per-project dashboard (P&L, cash flow, insights) |
| `/transactions` | All transactions |
| `/api/projects` | Projects REST API |
| `/api/seed` | Seed mock data (dev only) |

---

## Testing the Feature

1. **Create a project**: Go to `/projects` → click "إنشاء مشروع جديد" → fill in name, icon, type, and optionally a budget limit.
2. **Link a card**: Open a project → click "ربط بطاقة" → enter 4 digits (e.g., `4242`).
3. **Add transactions**: Go to `/transactions` → click "+" → select the project from the dropdown.
4. **View per-project dashboard**: Click on any project card → see isolated P&L, cash flow, and insights.
5. **Edit a project**: Click the edit icon on a project card → change name or budget → save.
6. **Delete a project**: Click the delete icon → confirm → project disappears; its transactions become unassigned.

---

## Without Supabase

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set, the API routes will fail to connect to Supabase. In this case, the API returns empty data gracefully and the UI shows empty states.

To use the full feature without a live Supabase instance, set up a local Supabase:

```bash
npx supabase start
```

Then copy the local credentials into `.env.local`.
