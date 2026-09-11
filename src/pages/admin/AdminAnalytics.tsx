import React, { useState } from 'react';
import { useAdminTasks } from '@/hooks/useAdminTasks';
import { useUsers } from '@/hooks/useUsers';
import { usePerformance } from '@/hooks/usePerformance';
import {
  CompletionTrendChart,
  StatusDistributionChart,
  OnTimeVsLateChart,
  CompletedVsPendingChart,
  TeamPerformanceChart,
} from '@/components/charts/PerformanceCharts';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Award, Clock, Flame, Calendar, TrendingUp } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const { allTasks, loading: tasksLoading } = useAdminTasks();
  const { users, loading: usersLoading } = useUsers();
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  const { metrics, trend, statusDistribution, onTimeVsLate, teamPerformance } = usePerformance(
    allTasks,
    users,
    timeRange
  );

  const loading = tasksLoading || usersLoading;

  return (
    <div className="space-y-6 text-left">
      {/* Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Organization-Wide Analytics
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Holistic velocity, schedule compliance, and performance computed from actual Firestore records
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 self-start sm:self-auto shadow-xs">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timeRange === days
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Strip */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>On-Time Delivery Rate</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.onTimeRate}%
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">
              {metrics.onTimeCompletedTasks} of {metrics.completedTasks} closed without delay
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Average Turnaround</span>
              <Clock className="w-4 h-4 text-brand-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {metrics.averageCompletionTimeFormatted}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Creation to completion mean</div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completed This Week</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.completedThisWeek}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Sprint resolution count</div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completed This Month</span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {metrics.completedThisMonth}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Monthly volume delivered</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Bar */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Department Performance Comparison
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Completed versus pending and in-progress tasks across all departments
          </p>
          <TeamPerformanceChart data={teamPerformance} />
        </div>

        {/* Trend Line */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Organizational Velocity Trend
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Velocity comparison of created tasks vs completed tasks
          </p>
          <CompletionTrendChart data={trend} />
        </div>

        {/* Status Breakdown Bar */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Task Volume by State
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Current backlog, active implementation, and closed tickets
          </p>
          <CompletedVsPendingChart
            completed={metrics.completedTasks}
            pending={metrics.pendingTasks}
            inProgress={metrics.inProgressTasks}
          />
        </div>

        {/* On-Time vs Late Donut */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Delivery Punctuality
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Completed tasks delivered on schedule vs overdue deliveries
          </p>
          <OnTimeVsLateChart data={onTimeVsLate} />
        </div>

        {/* Status Distribution Donut */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Global Workflow Distribution
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Ratio across To Do, In Progress, and Completed
          </p>
          <StatusDistributionChart data={statusDistribution} />
        </div>
      </div>
    </div>
  );
};
