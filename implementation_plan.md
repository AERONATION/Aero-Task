# Implementation Plan: Employee Workload Command Center

## 🎯 Goal

Build an **industry-grade Employee Workload Dashboard** (`/admin/workload`) for AeroTask — a real-time, per-employee capacity visibility system used by engineering managers, project leads, and HRs at top companies (Atlassian Jira, Linear, Asana, Monday.com).

---

## 📐 Architecture Overview

```
Firebase Firestore
     ├── /tasks (all tasks with assignedTo[], status, priority, deadline)
     └── /users (all employees with team, designation, etc.)
            │
            ▼
  useWorkload.ts  (pure computation hook)
  ├── calculateEmployeeWorkload()   → per-user metrics
  ├── calculateWorkloadScore()      → composite risk score 0–100
  ├── calculateBurnoutRisk()        → 'safe' | 'moderate' | 'high' | 'critical'
  └── classifyCapacity()            → 'under' | 'normal' | 'over' | 'maxed'
            │
            ▼
  AdminWorkload.tsx  (page)
  ├── Header + Filters (team, risk level, view mode)
  ├── Summary KPI Strip  (org-wide capacity health)
  ├── Workload Heatmap Grid  (employee cards)
  ├── Load Distribution Bar Chart  (recharts)
  ├── Capacity Matrix Table  (detailed breakdown)
  └── Burnout Risk Leaderboard
```

---

## 🧮 Workload Score Algorithm (Industry Standard)

Each employee gets a **Workload Score (0–100)** computed as:

```
activeWeight    = active tasks count    × 10
urgentBonus     = urgent tasks count    × 20
overdueBonus    = overdue tasks count   × 30
deadlinePressure = tasks due in 7 days  × 5

rawScore = activeWeight + urgentBonus + overdueBonus + deadlinePressure
score = min(100, rawScore)
```

**Capacity Classification:**
| Score | Label | Badge Color |
|-------|-------|-------------|
| 0–25  | Under-utilized | Blue |
| 26–50 | Normal Load | Green |
| 51–75 | High Load | Amber |
| 76–90 | Overloaded | Orange |
| 91–100 | Maxed Out 🔥 | Red |

**Burnout Risk:**
- `critical` → overdue ≥ 3 AND urgent ≥ 2
- `high` → overdue ≥ 2 OR (active ≥ 5 AND urgent ≥ 1)
- `moderate` → overdue ≥ 1 OR active ≥ 4
- `safe` → everything else

---

## 🖥️ UI Sections (Visual Design)

### 1. Header + Smart Filters
- Title: "Workforce Capacity Monitor"
- Filters: `Team dropdown` | `Risk Level` | `View: Grid / Table` | `Time Range: 7/30/90d`
- Export CSV button (downloads workload data)
- Live badge: "15 employees · 3 overloaded · 2 at risk"

### 2. Org Health KPI Strip (5 cards)
| Metric | Source |
|--------|--------|
| Total Active Employees | users.isActive |
| Avg Workload Score | mean of all scores |
| Overloaded Members | score > 75 count |
| At Risk (burnout) | burnoutRisk = high/critical |
| Org Capacity Utilization % | mean score as % |

### 3. Workload Heatmap Grid
- Employee cards in a responsive grid (3–4 cols)
- Each card shows:
  - Avatar initials + name + designation + team badge
  - Circular progress gauge (workload score)
  - Horizontal mini-bars: Active / Overdue / Urgent / Done this month
  - Capacity label (colored badge)
  - Burnout risk indicator (flame icon if high/critical)
  - Deadline pressure: "3 due this week"
  - Quick link → `/admin/users/:uid` (view full profile)

### 4. Load Distribution Bar Chart (Recharts)
- Horizontal bar chart: Employee name (Y-axis) → Total active tasks (X-axis)
- Color-coded bars by capacity (green/amber/red)
- Shows top 10–15 employees sorted by workload
- Tooltip: Shows task breakdown (todo / in_progress / urgent / overdue)

### 5. Capacity Matrix Table
- Sortable columns: Employee | Team | Active | Overdue | Urgent | Done(30d) | Avg Completion | Score | Risk
- Color-coded rows
- Click row → navigate to admin user detail page
- Pagination (10 per page)

### 6. Burnout Risk Panel
- Collapsible panel at the bottom
- Lists employees classified as `high` or `critical` burnout risk
- Shows: name, team, specific reason (e.g., "4 overdue tasks, 2 urgent"), action button → "Send Reminder"

---

## 📁 Files to Create / Modify

### ─── NEW FILES ───

#### [NEW] `src/pages/admin/AdminWorkload.tsx`
Main page component — assembles all sections, uses `useWorkload` hook.

#### [NEW] `src/hooks/useWorkload.ts`
Pure computation hook:
```ts
export interface EmployeeWorkload {
  user: UserProfile;
  totalTasks: number;
  activeTasks: number;         // todo + in_progress
  inProgressTasks: number;
  todoTasks: number;
  completedTasks: number;
  completedThisMonth: number;
  overdueTasks: number;
  urgentTasks: number;
  tasksDueThisWeek: number;
  workloadScore: number;       // 0–100
  capacityLabel: CapacityLabel;
  burnoutRisk: BurnoutRisk;
  avgCompletionDays: number;
  tasks: Task[];
}

export function useWorkload(tasks: Task[], users: UserProfile[]): {
  workloads: EmployeeWorkload[];
  orgStats: OrgWorkloadStats;
  loading: boolean;
}
```

#### [NEW] `src/services/workloadService.ts`
Pure functions (no React, easily testable):
- `calculateEmployeeWorkloads(tasks, users): EmployeeWorkload[]`
- `calculateWorkloadScore(metrics): number`
- `classifyCapacity(score): CapacityLabel`
- `calculateBurnoutRisk(metrics): BurnoutRisk`
- `getOrgWorkloadStats(workloads): OrgWorkloadStats`
- `exportWorkloadCSV(workloads): void`

#### [NEW] `src/components/charts/WorkloadCharts.tsx`
- `WorkloadBarChart` — horizontal bar chart (recharts)
- `WorkloadGaugeChart` — circular score gauge (custom SVG, no lib dependency)

### ─── MODIFIED FILES ───

#### [MODIFY] `src/App.tsx`
Add route: `<Route path="workload" element={<AdminWorkload />} />`

#### [MODIFY] `src/components/layout/Sidebar.tsx`
Add nav link under Administration: `Activity` icon → `/admin/workload` → "Workload"

#### [MODIFY] `src/components/layout/AppLayout.tsx`
Add `getPageTitle` entry for `/admin/workload` → `'Workforce Capacity'`

---

## 🔄 Data Flow (No New Firestore Reads)

> **Zero additional Firebase cost** — reuses already-subscribed `subscribeAllTasks` + `subscribeAllUsers` streams from existing hooks.

```
useAdminTasks()  →  allTasks[]
useUsers()       →  users[]
                      ↓
useWorkload(allTasks, users)
  → workloadService.calculateEmployeeWorkloads()
  → Returns EmployeeWorkload[] (pure client-side computation)
  → No new Firestore queries needed
```

---

## 🎨 Design Specification

- **Color system**: Reuses existing brand + zinc palette
- **Capacity colors**: `blue-500` (under) | `emerald-500` (normal) | `amber-500` (high) | `orange-500` (over) | `rose-500` (maxed)
- **Cards**: Same `rounded-2xl border shadow-xs` pattern as existing cards
- **Charts**: Recharts (already installed) with dark-mode-aware tooltip styles
- **Gauge**: Custom SVG radial arc (no extra library, lightweight)
- **Loading**: Reuse existing `CardSkeleton` pattern

---

## 📦 Dependencies

| Package | Status | Usage |
|---------|--------|-------|
| `recharts` | ✅ Already installed | WorkloadBarChart |
| `date-fns` | ✅ Already installed | Deadline calculations |
| `lucide-react` | ✅ Already installed | Icons |
| No new installs needed | — | — |

---

## ✅ Verification Plan

### Build Verification
```bash
npx tsc --noEmit   # Zero TypeScript errors
npm run build      # Clean production build
```

### Functional Verification
1. Admin logs in → `/admin/workload` visible in sidebar
2. Employees shown with correct task counts cross-checked against `/admin/tasks` filter
3. Workload scores compute correctly for 0-task employees (score = 0, Under-utilized)
4. Overdue tasks correctly classified (past deadline, not completed)
5. Export CSV downloads file with correct data
6. Clicking employee card navigates to `/admin/users/:uid`
7. Filters (team, risk) correctly narrow the employee grid
8. Burnout risk panel shows only high/critical employees

---

## 🗂️ Implementation Order

1. `workloadService.ts` — pure functions (no UI)
2. `useWorkload.ts` — hook wrapping the service
3. `WorkloadCharts.tsx` — chart components
4. `AdminWorkload.tsx` — full page assembly
5. Route + Sidebar + AppLayout updates
6. TypeScript check + git push
