import { useMemo } from 'react';
import { Task } from '@/types/task';
import { UserProfile } from '@/types/user';
import {
  calculatePerformanceMetrics,
  calculateCompletionTrend,
  calculateStatusDistribution,
  calculateOnTimeVsLateData,
  calculateTeamPerformance,
  filterTasksByDays,
} from '@/services/analyticsService';

export function usePerformance(tasks: Task[], users: UserProfile[] = [], days: 7 | 30 | 90 = 30) {
  return useMemo(() => {
    const filteredByDate = filterTasksByDays(tasks, days);
    const metrics = calculatePerformanceMetrics(tasks);
    const trend = calculateCompletionTrend(tasks, days === 90 ? 30 : days);
    const statusDistribution = calculateStatusDistribution(tasks);
    const onTimeVsLate = calculateOnTimeVsLateData(tasks);
    const teamPerformance = users.length > 0 ? calculateTeamPerformance(users, tasks) : [];

    return {
      metrics,
      trend,
      statusDistribution,
      onTimeVsLate,
      teamPerformance,
      filteredTasksCount: filteredByDate.length,
    };
  }, [tasks, users, days]);
}
