import { Task } from '@/types/task';
import { UserProfile, TeamType, TEAMS } from '@/types/user';
import {
  toDate,
  isOverdue,
  isCompletedOnTime,
  isCompletedLate,
} from '@/utils/date';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  isWithinInterval,
  format,
  eachDayOfInterval,
  differenceInHours,
} from 'date-fns';

export interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;        // 0 to 100 %
  onTimeRate: number;            // 0 to 100 % of completed tasks
  lateCompletedTasks: number;
  onTimeCompletedTasks: number;
  averageCompletionTimeHours: number;
  averageCompletionTimeFormatted: string;
  completedThisWeek: number;
  completedThisMonth: number;
}

/**
 * Calculates core metrics based on a collection of tasks.
 */
export function calculatePerformanceMetrics(tasks: Task[]): PerformanceMetrics {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      onTimeRate: 0,
      lateCompletedTasks: 0,
      onTimeCompletedTasks: 0,
      averageCompletionTimeHours: 0,
      averageCompletionTimeFormatted: '—',
      completedThisWeek: 0,
      completedThisMonth: 0,
    };
  }

  let completedTasks = 0;
  let pendingTasks = 0;
  let inProgressTasks = 0;
  let overdueTasks = 0;
  let onTimeCompletedTasks = 0;
  let lateCompletedTasks = 0;
  let totalCompletionDurationHours = 0;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let completedThisWeek = 0;
  let completedThisMonth = 0;

  tasks.forEach((task) => {
    if (task.status === 'completed') {
      completedTasks++;

      if (task.completedAt) {
        const completedDate = toDate(task.completedAt);

        // Check week / month completion
        if (isWithinInterval(completedDate, { start: weekStart, end: weekEnd })) {
          completedThisWeek++;
        }
        if (isWithinInterval(completedDate, { start: monthStart, end: monthEnd })) {
          completedThisMonth++;
        }

        // On-time vs Late
        if (isCompletedOnTime(task)) {
          onTimeCompletedTasks++;
        } else if (isCompletedLate(task)) {
          lateCompletedTasks++;
        } else {
          // If no deadline, default to on-time
          onTimeCompletedTasks++;
        }

        // Completion duration
        if (task.createdAt) {
          const createdDate = toDate(task.createdAt);
          const diffHours = Math.max(1, differenceInHours(completedDate, createdDate));
          totalCompletionDurationHours += diffHours;
        }
      }
    } else if (task.status === 'in_progress') {
      inProgressTasks++;
      if (isOverdue(task)) overdueTasks++;
    } else {
      pendingTasks++;
      if (isOverdue(task)) overdueTasks++;
    }
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const onTimeRate =
    completedTasks > 0 ? Math.round((onTimeCompletedTasks / completedTasks) * 100) : 0;

  const avgHours =
    completedTasks > 0 ? Math.round(totalCompletionDurationHours / completedTasks) : 0;

  let averageCompletionTimeFormatted = '—';
  if (avgHours > 0) {
    if (avgHours < 24) {
      averageCompletionTimeFormatted = `${avgHours}h`;
    } else {
      const days = (avgHours / 24).toFixed(1);
      averageCompletionTimeFormatted = `${days}d`;
    }
  }

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    completionRate,
    onTimeRate,
    lateCompletedTasks,
    onTimeCompletedTasks,
    averageCompletionTimeHours: avgHours,
    averageCompletionTimeFormatted,
    completedThisWeek,
    completedThisMonth,
  };
}

/**
 * Filter tasks by created or completed within the last N days
 */
export function filterTasksByDays(tasks: Task[], days: 7 | 30 | 90): Task[] {
  const cutoff = subDays(new Date(), days);
  return tasks.filter((task) => {
    const created = toDate(task.createdAt);
    return created >= cutoff;
  });
}

/**
 * Generates data for Daily/Weekly Task Completion trend chart
 */
export interface TrendPoint {
  date: string;
  completed: number;
  created: number;
}

export function calculateCompletionTrend(tasks: Task[], days: 7 | 30 | 90 = 7): TrendPoint[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });

  const pointsMap = new Map<string, { completed: number; created: number }>();

  // Initialize all days in range with 0
  intervalDays.forEach((day) => {
    const key = format(day, days <= 7 ? 'EEE' : 'MMM d');
    pointsMap.set(key, { completed: 0, created: 0 });
  });

  tasks.forEach((task) => {
    if (task.createdAt) {
      const createdDate = toDate(task.createdAt);
      if (createdDate >= startDate && createdDate <= endDate) {
        const key = format(createdDate, days <= 7 ? 'EEE' : 'MMM d');
        if (pointsMap.has(key)) {
          pointsMap.get(key)!.created++;
        }
      }
    }

    if (task.status === 'completed' && task.completedAt) {
      const completedDate = toDate(task.completedAt);
      if (completedDate >= startDate && completedDate <= endDate) {
        const key = format(completedDate, days <= 7 ? 'EEE' : 'MMM d');
        if (pointsMap.has(key)) {
          pointsMap.get(key)!.completed++;
        }
      }
    }
  });

  return Array.from(pointsMap.entries()).map(([date, counts]) => ({
    date,
    completed: counts.completed,
    created: counts.created,
  }));
}

/**
 * Generates data for Status Distribution donut chart
 */
export function calculateStatusDistribution(tasks: Task[]) {
  const counts = {
    todo: 0,
    in_progress: 0,
    completed: 0,
  };

  tasks.forEach((t) => {
    if (t.status === 'in_progress') counts.in_progress++;
    else if (t.status === 'completed') counts.completed++;
    else counts.todo++;
  });

  return [
    { name: 'To Do', value: counts.todo, color: '#94a3b8' },
    { name: 'In Progress', value: counts.in_progress, color: '#f59e0b' },
    { name: 'Completed', value: counts.completed, color: '#10b981' },
  ];
}

/**
 * Generates data for On-Time vs Late Completion donut chart
 */
export function calculateOnTimeVsLateData(tasks: Task[]) {
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  let onTime = 0;
  let late = 0;

  completedTasks.forEach((t) => {
    if (isCompletedLate(t)) {
      late++;
    } else {
      onTime++;
    }
  });

  return [
    { name: 'On-Time', value: onTime, color: '#10b981' },
    { name: 'Late', value: late, color: '#f43f5e' },
  ];
}

/**
 * Generates Team Performance metrics across all 7 departments
 */
export interface TeamPerformanceData {
  team: TeamType;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  onTimeRate: number;
}

export function calculateTeamPerformance(
  users: UserProfile[],
  tasks: Task[]
): TeamPerformanceData[] {
  return TEAMS.map((teamName) => {
    const teamMembers = users.filter((u) => u.team === teamName);
    const memberUids = new Set(teamMembers.map((m) => m.uid));

    // Tasks belong to team either explicitly by task.team or by assigned member
    const teamTasks = tasks.filter(
      (t) => t.team === teamName || (t.assignedTo && memberUids.has(t.assignedTo))
    );

    const metrics = calculatePerformanceMetrics(teamTasks);

    return {
      team: teamName,
      totalMembers: teamMembers.length,
      totalTasks: metrics.totalTasks,
      completedTasks: metrics.completedTasks,
      pendingTasks: metrics.pendingTasks + metrics.inProgressTasks,
      overdueTasks: metrics.overdueTasks,
      completionRate: metrics.completionRate,
      onTimeRate: metrics.onTimeRate,
    };
  });
}
