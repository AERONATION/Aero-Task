import { useState, useEffect, useMemo } from 'react';
import { Task, TaskFilterOptions } from '@/types/task';
import { subscribeUserTasks } from '@/services/taskService';
import { useAuth } from './useAuth';

export function useTasks(initialFilters?: TaskFilterOptions) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TaskFilterOptions>(initialFilters || {});

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeUserTasks(
      user.uid,
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter (title or description)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (task.status !== filters.status) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (task.priority !== filters.priority) return false;
      }

      return true;
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
