/**
 * workloadService.ts
 * Pure, framework-agnostic computation engine for employee workload analysis.
 * No React deps — fully unit-testable.
 */

import { Task } from '@/types/task';
import { UserProfile } from '@/types/user';
import { toDate, isOverdue } from '@/utils/date';
import {
  subDays,
  startOfMonth,
  isWithinInterval,
  endOfMonth,
  differenceInCalendarDays,
  differenceInHours,
} from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type CapacityLabel = 'under' | 'normal' | 'high' | 'over' | 'maxed';

export type BurnoutRisk = 'safe' | 'moderate' | 'high' | 'critical';

export interface EmployeeWorkload {
  user: UserProfile;

  /* task counts */
  totalTasks: number;
  activeTasks: number;        // todo + in_progress
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completedThisMonth: number;
  overdueTasks: number;
  urgentTasks: number;
  highPriorityTasks: number;
  tasksDueThisWeek: number;    // active tasks with deadline ≤ 7 days

  /* computed scores */
  workloadScore: number;       // 0–100 composite
  capacityLabel: CapacityLabel;
  burnoutRisk: BurnoutRisk;

  /* velocity */
  avgCompletionDays: number;   // mean days to close tasks

  /* raw task list for drill-down */
  tasks: Task[];
}

export interface OrgWorkloadStats {
  totalEmployees: number;
  avgWorkloadScore: number;
  overloadedCount: number;    // score > 75
  burnoutRiskCount: number;   // high or critical
  underutilizedCount: number; // score ≤ 25
  capacityUtilization: number; // org-level avg as %
  criticalCount: number;
}

/* ─── Score Weights ──────────────────────────────────────────────────────── */

const W = {
  activeTask:      10,
  urgentTask:      20,
  overdueTask:     30,
  dueSoonTask:      5,   // due within 7 days
  highPriority:     8,
} as const;

/* ─── Core Calculation Functions ─────────────────────────────────────────── */

/**
 * Calculate composite workload score (0–100).
 * Based on resource-capacity models used in Jira Advanced Roadmaps & Monday.com.
 */
export function calculateWorkloadScore(p: {
  activeTasks: number;
  urgentTasks: number;
  overdueTasks: number;
  tasksDueThisWeek: number;
  highPriorityTasks: number;
}): number {
  const raw =
    p.activeTasks       * W.activeTask +
    p.urgentTasks       * W.urgentTask +
    p.overdueTasks      * W.overdueTask +
    p.tasksDueThisWeek  * W.dueSoonTask +
    p.highPriorityTasks * W.highPriority;

  return Math.min(100, raw);
}

/**
 * Classify score into capacity labels used by industry PM tools.
 */
export function classifyCapacity(score: number): CapacityLabel {
  if (score <= 25) return 'under';
  if (score <= 50) return 'normal';
  if (score <= 75) return 'high';
  if (score <= 90) return 'over';
  return 'maxed';
}

/**
 * Evaluate burnout risk for an employee.
 * Mirrors the Workday / HiBob resource health indicators.
 */
export function calculateBurnoutRisk(p: {
  overdueTasks: number;
  urgentTasks: number;
  activeTasks: number;
  tasksDueThisWeek: number;
}): BurnoutRisk {
  if (p.overdueTasks >= 3 && p.urgentTasks >= 2) return 'critical';
  if (p.overdueTasks >= 2) return 'high';
  if (p.activeTasks >= 5 && p.urgentTasks >= 1) return 'high';
  if (p.overdueTasks >= 1 || p.activeTasks >= 4) return 'moderate';
  if (p.tasksDueThisWeek >= 3) return 'moderate';
  return 'safe';
}

/* ─── Per-Employee Computation ───────────────────────────────────────────── */

function computeEmployeeWorkload(
  user: UserProfile,
  allTasks: Task[]
): EmployeeWorkload {
  const now       = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  // All tasks assigned to this employee
  const tasks = allTasks.filter((t) =>
    Array.isArray(t.assignedTo)
      ? t.assignedTo.includes(user.uid)
      : t.assignedTo === user.uid
  );

  let todoTasks       = 0;
  let inProgressTasks = 0;
  let completedTasks  = 0;
  let completedThisMonth = 0;
  let overdueTasks    = 0;
  let urgentTasks     = 0;
  let highPriorityTasks = 0;
  let tasksDueThisWeek  = 0;
  let totalCompletionHours = 0;
  let completionCount      = 0;

  tasks.forEach((t) => {
    if (t.status === 'completed') {
      completedTasks++;
      if (t.completedAt) {
        const completedDate = toDate(t.completedAt);
        if (isWithinInterval(completedDate, { start: monthStart, end: monthEnd })) {
          completedThisMonth++;
        }
        if (t.createdAt) {
          const hours = Math.max(1, differenceInHours(completedDate, toDate(t.createdAt)));
          totalCompletionHours += hours;
          completionCount++;
        }
      }
    } else if (t.status === 'in_progress') {
      inProgressTasks++;
      if (isOverdue(t)) overdueTasks++;
    } else {
      todoTasks++;
      if (isOverdue(t)) overdueTasks++;
    }

    // Active (non-completed) task analysis
    if (t.status !== 'completed') {
      if (t.priority === 'urgent') urgentTasks++;
      if (t.priority === 'high') highPriorityTasks++;
      if (t.deadline) {
        const dl = toDate(t.deadline);
        if (dl >= now && dl <= weekAhead) tasksDueThisWeek++;
      }
    }
  });

  const activeTasks = todoTasks + inProgressTasks;

  const workloadScore = calculateWorkloadScore({
    activeTasks,
    urgentTasks,
    overdueTasks,
    tasksDueThisWeek,
    highPriorityTasks,
  });

  const capacityLabel = classifyCapacity(workloadScore);

  const burnoutRisk = calculateBurnoutRisk({
    overdueTasks,
    urgentTasks,
    activeTasks,
    tasksDueThisWeek,
  });

  const avgCompletionDays = completionCount > 0
    ? Math.round(totalCompletionHours / completionCount / 24)
    : 0;

  return {
    user,
    totalTasks: tasks.length,
    activeTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    completedThisMonth,
    overdueTasks,
    urgentTasks,
    highPriorityTasks,
    tasksDueThisWeek,
    workloadScore,
    capacityLabel,
    burnoutRisk,
    avgCompletionDays,
    tasks,
  };
}

/* ─── Main Entry Point ────────────────────────────────────────────────────── */

/**
 * Computes workload metrics for every employee.
 * Sorted descending by workload score (most loaded first).
 */
export function calculateEmployeeWorkloads(
  tasks: Task[],
  users: UserProfile[]
): EmployeeWorkload[] {
  // Only active employees
  const activeUsers = users.filter((u) => u.isActive !== false);
  return activeUsers
    .map((u) => computeEmployeeWorkload(u, tasks))
    .sort((a, b) => b.workloadScore - a.workloadScore);
}

/* ─── Org-Level Aggregation ──────────────────────────────────────────────── */

export function getOrgWorkloadStats(workloads: EmployeeWorkload[]): OrgWorkloadStats {
  if (workloads.length === 0) {
    return {
      totalEmployees: 0,
      avgWorkloadScore: 0,
      overloadedCount: 0,
      burnoutRiskCount: 0,
      underutilizedCount: 0,
      capacityUtilization: 0,
      criticalCount: 0,
    };
  }

  const totalScore = workloads.reduce((acc, w) => acc + w.workloadScore, 0);
  const avgScore   = Math.round(totalScore / workloads.length);

  return {
    totalEmployees:     workloads.length,
    avgWorkloadScore:   avgScore,
    overloadedCount:    workloads.filter((w) => w.workloadScore > 75).length,
    burnoutRiskCount:   workloads.filter((w) => w.burnoutRisk === 'high' || w.burnoutRisk === 'critical').length,
    underutilizedCount: workloads.filter((w) => w.workloadScore <= 25).length,
    capacityUtilization: avgScore,
    criticalCount:       workloads.filter((w) => w.burnoutRisk === 'critical').length,
  };
}

/* ─── CSV Export ──────────────────────────────────────────────────────────── */

export function exportWorkloadCSV(workloads: EmployeeWorkload[]): void {
  const headers = [
    'Name', 'Email', 'Team', 'Designation', 'Total Tasks', 'Active', 'In Progress',
    'Overdue', 'Urgent', 'Due This Week', 'Completed (Month)',
    'Workload Score', 'Capacity', 'Burnout Risk', 'Avg Completion (days)',
  ];

  const rows = workloads.map((w) => [
    w.user.name,
    w.user.email,
    w.user.team || '—',
    w.user.designation || '—',
    w.totalTasks,
    w.activeTasks,
    w.inProgressTasks,
    w.overdueTasks,
    w.urgentTasks,
    w.tasksDueThisWeek,
    w.completedThisMonth,
    w.workloadScore,
    w.capacityLabel,
    w.burnoutRisk,
    w.avgCompletionDays || '—',
  ]);

  const csvContent =
    [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `workload-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ─── Display Helpers ─────────────────────────────────────────────────────── */

export const CAPACITY_META: Record<CapacityLabel, { label: string; color: string; bg: string; darkBg: string; bar: string }> = {
  under:  { label: 'Under-utilized', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50',   darkBg: 'dark:bg-blue-950',   bar: '#3b82f6' },
  normal: { label: 'Normal Load',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950', bar: '#10b981' },
  high:   { label: 'High Load',      color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50',  darkBg: 'dark:bg-amber-950',  bar: '#f59e0b' },
  over:   { label: 'Overloaded',     color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-950', bar: '#f97316' },
  maxed:  { label: 'Maxed Out',      color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50',   darkBg: 'dark:bg-rose-950',   bar: '#f43f5e' },
};

export const RISK_META: Record<BurnoutRisk, { label: string; color: string; dotColor: string }> = {
  safe:     { label: 'Safe',     color: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  moderate: { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400',     dotColor: 'bg-amber-500' },
  high:     { label: 'High Risk',  color: 'text-orange-600 dark:text-orange-400', dotColor: 'bg-orange-500' },
  critical: { label: 'Critical 🔥', color: 'text-rose-600 dark:text-rose-400',   dotColor: 'bg-rose-500' },
};
