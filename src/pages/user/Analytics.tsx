import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { usePerformance } from '@/hooks/usePerformance';
import {
  CompletionTrendChart,
  StatusDistributionChart,
  OnTimeVsLateChart,
  CompletedVsPendingChart,
} from '@/components/charts/PerformanceCharts';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { CheckCircle2, Clock, Calendar, TrendingUp, Award, Flame } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { allTasks, loading } = useTasks();
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const { metrics, trend, statusDistribution, onTimeVsLate } = usePerformance(
    allTasks,
    [],
    timeRange
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Performance & Velocity
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Real-time analytics computed directly from your task delivery history
          </p>
        </div>

        {/* Time range selector */}
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

      {/* Primary KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* On-Time Rate */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>On-Time Delivery</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.onTimeRate}%
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">
              {metrics.onTimeCompletedTasks} of {metrics.completedTasks} completed on schedule
            </div>
          </div>

          {/* Average Completion Time */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Average Turnaround</span>
              <Clock className="w-4 h-4 text-brand-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {metrics.averageCompletionTimeFormatted}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Average time to complete</div>
          </div>

          {/* Completed this Week */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completed This Week</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.completedThisWeek}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Current sprint completions</div>
          </div>

          {/* Completed this Month */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completed This Month</span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {metrics.completedThisMonth}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Monthly total output</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Completion vs Creation Velocity
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Track whether task resolution is pacing ahead of newly added work
          </p>
          <CompletionTrendChart data={trend} />
        </div>

        {/* Completed vs Pending Bar Chart */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Status Breakdown
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Volume of tasks currently in backlog, active development, and closed
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
            Schedule Adherence
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Ratio of tasks finished before or at deadline versus past deadline
          </p>
          <OnTimeVsLateChart data={onTimeVsLate} />
        </div>

        {/* Status Distribution Donut */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Task State Distribution
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Current balance across active workflow states
          </p>
          <StatusDistributionChart data={statusDistribution} />
        </div>
      </div>
    </div>
  );
};
