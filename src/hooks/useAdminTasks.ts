import { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { subscribeAllTasks } from '@/services/taskService';
import { toDate } from '@/utils/date';

export interface AdminTaskFilterOptions {
  search?: string;
  team?: string;
  assignedTo?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  sortBy?: 'createdAt' | 'deadline' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export function useAdminTasks(initialFilters?: AdminTaskFilterOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<AdminTaskFilterOptions>(initialFilters || {
    status: 'all',
    priority: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllTasks(
      (allTasks) => {
        setTasks(allTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Team
      if (filters.team && filters.team !== 'all') {
        if (task.team !== filters.team) return false;
      }

      // Assigned User
      if (filters.assignedTo && filters.assignedTo !== 'all') {
        const hasUser = Array.isArray(task.assignedTo)
          ? task.assignedTo.includes(filters.assignedTo)
          : task.assignedTo === filters.assignedTo;
        if (!hasUser) return false;
      }

      // Status
      if (filters.status && filters.status !== 'all') {
        if (task.status !== filters.status) return false;
      }

      // Priority
      if (filters.priority && filters.priority !== 'all') {
        if (task.priority !== filters.priority) return false;
      }

      return true;
    }).sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1;

      if (filters.sortBy === 'deadline') {
        const aDate = toDate(a.deadline).getTime();
        const bDate = toDate(b.deadline).getTime();
        return (aDate - bDate) * order;
      }

      if (filters.sortBy === 'priority') {
        const priorityWeight: Record<string, number> = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        return ((priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0)) * order;
      }

      if (filters.sortBy === 'title') {
        return a.title.localeCompare(b.title) * order;
      }

      // Default: createdAt
      const aDate = toDate(a.createdAt).getTime();
      const bDate = toDate(b.createdAt).getTime();
      return (aDate - bDate) * order;
    });
  }, [tasks, filters]);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    error,
    filters,
    setFilters,
  };
}
