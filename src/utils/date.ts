import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays, differenceInHours } from 'date-fns';
import { Task } from '@/types/task';

/**
 * Safely converts Firestore Timestamp, Date, string, or number to JavaScript Date.
 */
export function toDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000);
  if (typeof timestamp === 'number' || typeof timestamp === 'string') return new Date(timestamp);
  return new Date();
}

/**
 * Formats a timestamp into a clean, professional string like 'Oct 24, 2026' or 'Oct 24, 2026, 4:00 PM'
 */
export function formatDate(timestamp: any, includeTime: boolean = false): string {
  if (!timestamp) return '—';
  try {
    const d = toDate(timestamp);
    if (isNaN(d.getTime())) return '—';
    return format(d, includeTime ? 'MMM d, yyyy · h:mm a' : 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

/**
 * Returns human-readable relative string e.g. "3 hours ago", "in 2 days"
 */
export function formatRelativeDate(timestamp: any): string {
  if (!timestamp) return '—';
  try {
    const d = toDate(timestamp);
    if (isNaN(d.getTime())) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

/**
 * Checks if a task is currently overdue:
 * current time > deadline AND status !== 'completed'
 */
export function isOverdue(task: Task): boolean {
  if (!task || task.status === 'completed' || !task.deadline) return false;
  const deadline = toDate(task.deadline);
  return isPast(deadline) && !isToday(deadline);
}

/**
 * Checks if task is due today
 */
export function isDueToday(task: Task): boolean {
  if (!task || task.status === 'completed' || !task.deadline) return false;
  const deadline = toDate(task.deadline);
  return isToday(deadline);
}

/**
 * Checks if task is due tomorrow
 */
export function isDueTomorrow(task: Task): boolean {
  if (!task || task.status === 'completed' || !task.deadline) return false;
  const deadline = toDate(task.deadline);
  return isTomorrow(deadline);
}

/**
 * Checks if task is due soon (e.g. within 3 days and not yet overdue)
 */
export function isDueSoon(task: Task): boolean {
  if (!task || task.status === 'completed' || !task.deadline) return false;
  const deadline = toDate(task.deadline);
  const now = new Date();
  if (deadline < now) return false;
  const daysDiff = differenceInDays(deadline, now);
  return daysDiff <= 3;
}

/**
 * Checks if completed task was on time:
 * completedAt <= deadline
 */
export function isCompletedOnTime(task: Task): boolean {
  if (!task || task.status !== 'completed' || !task.completedAt || !task.deadline) return false;
  const completed = toDate(task.completedAt);
  const deadline = toDate(task.deadline);
  return completed.getTime() <= deadline.getTime();
}

/**
 * Checks if completed task was late:
 * completedAt > deadline
 */
export function isCompletedLate(task: Task): boolean {
  if (!task || task.status !== 'completed' || !task.completedAt || !task.deadline) return false;
  const completed = toDate(task.completedAt);
  const deadline = toDate(task.deadline);
  return completed.getTime() > deadline.getTime();
}

/**
 * Returns comprehensive deadline status descriptor
 */
export interface DeadlineInfo {
  state: 'completed_on_time' | 'completed_late' | 'overdue' | 'due_today' | 'due_tomorrow' | 'due_soon' | 'upcoming';
  label: string;
  diffDays?: number;
}

export function getDeadlineInfo(task: Task): DeadlineInfo {
  if (!task.deadline) {
    return { state: 'upcoming', label: 'No deadline' };
  }

  const deadline = toDate(task.deadline);
  const now = new Date();

  if (task.status === 'completed') {
    if (task.completedAt && isCompletedOnTime(task)) {
      return { state: 'completed_on_time', label: 'Completed on time' };
    } else if (task.completedAt && isCompletedLate(task)) {
      return { state: 'completed_late', label: 'Completed late' };
    }
    return { state: 'completed_on_time', label: 'Completed' };
  }

  if (isToday(deadline)) {
    return { state: 'due_today', label: 'Due today' };
  }

  if (isTomorrow(deadline)) {
    return { state: 'due_tomorrow', label: 'Due tomorrow' };
  }

  if (deadline < now) {
    const overdueDays = Math.max(1, differenceInDays(now, deadline));
    return {
      state: 'overdue',
      label: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      diffDays: overdueDays,
    };
  }

  const remainingDays = differenceInDays(deadline, now);
  if (remainingDays <= 3) {
    return {
      state: 'due_soon',
      label: `Due in ${remainingDays + 1} days`,
      diffDays: remainingDays + 1,
    };
  }

  return {
    state: 'upcoming',
    label: `Due in ${remainingDays} days`,
    diffDays: remainingDays,
  };
}
