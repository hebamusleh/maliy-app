# API Contracts: Unified Projects Page

**Feature**: 003-projects-page
**Date**: 2026-04-30

All routes use the fallback auth helper: `getRequestUser()` returns the Supabase user or `{ id: 'anon-user' }` when unauthenticated.

---

## Projects

### `GET /api/projects`

Returns all projects for the current user.

**Response `200`**:
```json
{
  "projects": [
    {
      "id": "uuid",
      "user_id": "anon-user",
      "name": "فريلانس",
      "icon": "💻",
      "type": "freelance",
      "budget_limit": 5000,
      "created_at": "2026-04-01T00:00:00Z",
      "updated_at": "2026-04-01T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/projects`

Creates a new project.

**Request Body**:
```json
{
  "name": "فريلانس",
  "icon": "💻",
  "type": "freelance",
  "budget_limit": 5000
}
```

**Validation**:
- `name`: required, non-empty string
- `icon`: required, non-empty string
- `type`: required, one of `personal | business | freelance`
- `budget_limit`: optional, positive number

**Response `201`**:
```json
{ "project": { ...Project } }
```

**Response `400`** (validation failure):
```json
{ "error": "Missing required fields" }
```

---

### `GET /api/projects/[id]`

Returns a single project by ID.

**Response `200`**:
```json
{ "project": { ...Project } }
```

**Response `404`**: `{ "error": "Project not found" }`

---

### `PATCH /api/projects/[id]` *(new)*

Updates a project's editable fields.

**Request Body** (all fields optional):
```json
{
  "name": "updated name",
  "icon": "🏠",
  "type": "personal",
  "budget_limit": 3000
}
```

**Validation**: Same rules as POST for each provided field.

**Response `200`**:
```json
{ "project": { ...Project } }
```

**Response `404`**: Project not found or doesn't belong to user.

---

### `DELETE /api/projects/[id]` *(new)*

Deletes a project. Orphans its transactions (sets `project_id = null`).

**Response `200`**:
```json
{ "message": "تم حذف المشروع" }
```

**Response `404`**: Project not found.

---

## Project Dashboard

### `GET /api/projects/[id]/dashboard`

Returns aggregated dashboard data for a single project.

**Response `200`**:
```json
{
  "project": { ...Project },
  "stats": {
    "total_income": 12000,
    "total_expenses": 7500,
    "net_profit": 4500,
    "transaction_count": 14,
    "budget_used_percentage": 75
  },
  "recent_transactions": [ ...Transaction[] ],
  "insights": [ "المشروع مربح بقيمة 4500 ريال", "..." ]
}
```

---

## Card Links

### `GET /api/projects/[id]/cards`

Returns all card links for a project.

**Response `200`**:
```json
{ "cardLinks": [ { "id": "...", "project_id": "...", "last4": "4242", ... } ] }
```

---

### `POST /api/projects/[id]/cards`

Links a bank card (last 4 digits) to a project. A card can be linked to multiple projects; only exact duplicates (same card + same project) are rejected.

**Request Body**:
```json
{ "last4": "4242" }
```

**Validation**: `last4` must match `/^\d{4}$/`

**Response `201`**:
```json
{ "cardLink": { ...CardLink } }
```

**Response `400`** (exact duplicate):
```json
{ "error": "Card already linked to this project" }
```

**Change from previous**: Cross-project uniqueness check removed. A card with `last4 = '4242'` can now be linked to both "Business" and "Freelance" projects simultaneously.

---

### `DELETE /api/projects/[id]/cards/[cardId]` *(new)*

Removes a card link from a project.

**Response `200`**:
```json
{ "message": "تم إزالة ربط البطاقة" }
```

---

## Seed (Development Only)

### `POST /api/seed` *(new, dev only)*

Populates mock projects and transactions for `anon-user`. Only active when `NODE_ENV !== 'production'`. Idempotent — clears existing seed data before inserting.

**Response `200`**:
```json
{
  "message": "تم إضافة البيانات التجريبية",
  "created": { "projects": 3, "transactions": 20 }
}
```

---

## Component Contracts

### `ProjectCard` (new component)

Renders a single project card on the Projects list page.

```typescript
interface ProjectCardProps {
  project: Project;
  stats?: Pick<ProjectStats, 'total_expenses' | 'budget_used_percentage'>;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}
```

---

### `ProjectForm` (existing, extended)

Add optional `initialValues` prop for edit mode.

```typescript
interface ProjectFormProps {
  initialValues?: Partial<CreateProjectForm>;   // NEW: for edit mode
  onSubmit: (data: CreateProjectForm) => Promise<void>;
  onCancel: () => void;
}
```

---

### `ProjectPnLChart` (new component)

Bar chart showing monthly income vs expenses for a project, using `prepareChartData()`.

```typescript
interface ProjectPnLChartProps {
  transactions: Transaction[];
}
```

---

### `ProjectCashFlowChart` (new component, or reuse `CashFlowChart`)

Line chart of daily/monthly running balance for a project.

```typescript
interface ProjectCashFlowChartProps {
  transactions: Transaction[];
}
```
