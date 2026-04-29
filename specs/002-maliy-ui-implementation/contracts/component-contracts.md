# Component Contracts: ماليّ Full UI Implementation

**Feature**: 002-maliy-ui-implementation
**Date**: 2026-04-29

---

## Shell Layout Components

### `<Layout>` (update existing `src/components/layout/Layout.tsx`)

3-column persistent shell wrapping all `(shell)` routes.

```typescript
// No props — reads children + auth state internally
// Renders: <Sidebar /> | <main>{children}</main> | <ChatPanel />
// Responsive: collapses to 1-column on mobile (<1024px)
```

### `<Sidebar>`

```typescript
interface SidebarProps {}  // No props — uses router for active state
// Renders: brand, nav items, learning-accuracy card, user footer
// Nav item active state: determined by usePathname()
// Learning accuracy: fetched from GET /api/analytics (auto-classification rate)
```

### `<ChatPanel>`

```typescript
interface ChatPanelProps {}
// Renders: chat header, message list, suggestions bar, composer
// State: local message list + streaming state
// Data: useQuery(['chat-messages']) + POST /api/chat (streaming)
```

---

## Dashboard Components

### `<BalanceCard>`

```typescript
interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  pendingCount: number;
  changePercent: number;
}
```

### `<ReviewBanner>`

```typescript
interface ReviewBannerProps {
  pendingCount: number;
  onStart: () => void;  // navigate to /review
}
// Hidden when pendingCount === 0
```

### `<ProjectSummaryCards>`

```typescript
interface ProjectSummaryCardsProps {
  projects: ProjectSummary[];
}
// Renders up to 3 project cards in a responsive grid
```

### `<CashFlowChart>` (Recharts AreaChart)

```typescript
interface CashFlowChartProps {
  horizon: 7 | 30 | 90;
  onHorizonChange: (h: 7 | 30 | 90) => void;
  data: Array<{ date: string; actual: number | null; forecast: number | null }>;
  dangerZones: Array<{ start: string; end: string }>;
}
```

---

## Transaction Components

### `<TransactionList>`

```typescript
interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onTransactionClick: (tx: Transaction) => void;
}
// Grouped by date (day header rows)
// Infinite scroll via useIntersectionObserver
```

### `<TransactionFilters>`

```typescript
interface TransactionFiltersProps {
  projects: Project[];
  activeFilter: string;  // project_id | 'all' | 'income' | 'pending'
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}
```

### `<TransactionDetailModal>`

```typescript
interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onClassify?: (projectId: string) => void;
}
// Modal overlay, closes on backdrop click or Escape key
```

### `<ConfidenceMeter>`

```typescript
interface ConfidenceMeterProps {
  score: number;    // 0–1
  size?: 'sm' | 'md';
}
// Renders 5 pip indicators colored by level (high=sage, med=amber, low=rose)
// high: ≥0.8, med: ≥0.5, low: <0.5
```

---

## Review Components

### `<ReviewCard>`

```typescript
interface ReviewCardProps {
  transaction: Transaction;
  projects: Project[];
  suggestedProjectId: string | null;
  onClassify: (projectId: string, applyToMerchant: boolean) => void;
  onSkip: () => void;
  totalCount: number;
  currentIndex: number;
}
```

### `<ReviewProgressPips>`

```typescript
interface ReviewProgressPipsProps {
  total: number;
  current: number;  // 0-based index of active item
  completed: number[];
}
```

---

## Analytics Components

### `<CategoryBreakdown>`

```typescript
interface CategoryBreakdownProps {
  categories: CategorySpend[];  // sorted desc by amount
}
```

### `<ProjectDistributionChart>` (Recharts PieChart)

```typescript
interface ProjectDistributionChartProps {
  data: ProjectDistribution[];
}
```

### `<DailySpendChart>` (Recharts BarChart)

```typescript
interface DailySpendChartProps {
  data: DailySpend[];
  month: string;  // e.g. 'إبريل 2026'
}
```

---

## Chat Components

### `<ChatComposer>`

```typescript
interface ChatComposerProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  suggestions: string[];
}
// Includes VoiceInput button
```

### `<ChatMessage>`

```typescript
interface ChatMessageProps {
  message: ChatMessage;
  onChipAction?: (action: string, payload: unknown) => void;
}
// Renders bubble + optional RichCard via RichCardRenderer
```

### `<VoiceInput>`

```typescript
interface VoiceInputProps {
  onTranscript: (text: string) => void;
  lang?: string;  // default 'ar-SA'
}
// Uses Web Speech API
// Shows recording animation when active
// Falls back to hidden button on unsupported browsers
```

---

## Shared UI Components

### `<ConfidenceRibbon>` (for AI card header in chat)

```typescript
interface ConfidenceRibbonProps {
  score: number;
  label: string;  // e.g. 'ثقة عالية'
}
```

### `<SilentConfirm>` (inline confirmation strip)

```typescript
interface SilentConfirmProps {
  message: string;
  onUndo: () => void;
}
// Auto-dismisses after 5 seconds if not undone
```

### `<AlertItem>`

```typescript
interface AlertItemProps {
  alert: Alert;
  onAction: (actionType: string, payload: unknown) => void;
  onDismiss: (alertId: string) => void;
}
```
