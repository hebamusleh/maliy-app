# Quickstart: Project Management System

**Date**: 2026-04-29
**Feature**: specs/001-project-system/spec.md

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

## Setup Steps

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Database Setup

Run the SQL schema from `specs/001-project-system/data-model.md` in your Supabase SQL editor.

### 4. Authentication Setup

In Supabase Dashboard:

- Enable Email authentication
- Configure site URL to `http://localhost:3000`

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Feature Usage

### Create Your First Project

1. Navigate to `/projects`
2. Click "Create Project"
3. Fill in:
   - Name: "Personal Expenses"
   - Icon: Select an emoji
   - Type: Personal
   - Budget Limit: (optional) 5000
4. Click "Create"

### Link a Bank Card

1. Go to project details
2. Click "Link Card"
3. Enter last 4 digits of your card
4. Select the project to link to

### View Dashboard

1. Click on a project card
2. View P&L, insights, and cash flow
3. Transactions are automatically assigned based on linked cards

## Testing

```bash
npm run test
# or
yarn test
```

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

**Supabase connection fails**

- Check your environment variables
- Ensure Supabase project is active
- Verify RLS policies are applied

**RTL not working**

- Ensure `dir="rtl"` is set on root elements
- Check font loading in `globals.css`

**Voice input not working**

- Check browser compatibility (Chrome recommended)
- Ensure HTTPS in production (required for Web Speech API)

### Performance Tips

- Dashboard loads are optimized with TanStack Query caching
- Use React.memo for expensive components
- Monitor bundle size with `npm run analyze`
