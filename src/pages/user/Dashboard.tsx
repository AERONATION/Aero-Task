import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { usePerformance } from '@/hooks/usePerformance';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { DeadlineBadge } from '@/components/tasks/DeadlineBadge';
import { TaskModal } from '@/components/tasks/TaskModal';
import { updateTaskStatus } from '@/services/taskService';
import { subscribeRecentActivity } from '@/services/taskService';
import { ActivityLog, TaskStatus } from '@/types/task';
import { formatRelativeDate, formatDate } from '@/utils/date';
import { useToast } from '@/context/ToastContext';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Layers,
  Activity,
  CheckSquare,
} from 'lucide-react';
import { CompletionTrendChart, StatusDistributionChart } from '@/components/charts/PerformanceCharts';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { tasks, allTasks, loading } = useTasks();
  const { users, usersMap } = useUsers();
  const { metrics, trend, statusDistribution } = usePerformance(allTasks, [], 7);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const unsub = subscribeRecentActivity((logs) => {
      // Filter for logs relevant to current user
      const userLogs = logs.filter(
        (l) => l.userId === user?.uid || l.metadata?.assignedTo === user?.uid
      );
      setRecentLogs(userLogs.slice(0, 8));
    }, 15);

    return () => unsub();
  }, [user]);

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // Upcoming deadlines (next 5 incomplete tasks sorted by deadline)
  const upcomingDeadlines = allTasks
    .filter((t) => t.status !== 'completed')
    .slice(0, 5);

  const handleQuickComplete = async (taskId: string) => {
    const targetTask = allTasks.find((t) => t.id === taskId);
    if (!targetTask || !user) return;

    try {
      await updateTaskStatus(
        taskId,
        'completed',
        targetTask,
        user.uid,
        profile?.name || user.displayName || 'User'
      );
      success('Task marked as completed');
    } catch (err: any) {
      error(err.message || 'Failed to update task');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {getGreeting()}, {profile?.name || user?.displayName || 'Teammate'}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
            {profile?.team && (
              <>
                <span>•</span>
                <span className="font-medium text-brand-600 dark:text-brand-400">
                  {profile.team}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Total Tasks</span>
              <Layers className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {metrics.totalTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Assigned & created</div>
          </div>

          {/* Pending */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>To Do</span>
              <CheckSquare className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {metrics.pendingTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Awaiting start</div>
          </div>

          {/* In Progress */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>In Progress</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.inProgressTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Actively worked</div>
          </div>

          {/* Completed */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.completedTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Closed tasks</div>
          </div>

          {/* Overdue */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Overdue</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.overdueTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Passed deadline</div>
          </div>

          {/* Completion Rate */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completion</span>
              <TrendingUp className="w-4 h-4 text-brand-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
              {metrics.completionRate}%
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Overall velocity</div>
          </div>
        </div>
      )}

      {/* Main Grid: Upcoming Deadlines + Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Deadlines & Task Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines Card */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Upcoming Deadlines
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Prioritized tasks requiring your attention soon
                </p>
              </div>
              <Link
                to="/user/tasks"
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <EmptyState
                title="No impending deadlines"
                description="You are completely up to date. Create a new task or review your workload anytime."
                actionText="Create Task"
                onAction={() => setIsTaskModalOpen(true)}
              />
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {upcomingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleQuickComplete(task.id)}
                        className="mt-0.5 w-4 h-4 rounded border border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center transition-colors shrink-0"
                        title="Mark complete"
                      >
                        <CheckCircle2 className="w-3 h-3 text-transparent hover:text-emerald-500" />
                      </button>
                      <div className="min-w-0">
                        <Link
                          to={`/user/tasks/${task.id}`}
                          className="text-xs font-semibold text-zinc-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 truncate block"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="priority" priority={task.priority} />
                          <Badge variant="status" status={task.status} />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <DeadlineBadge task={task} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Task Activity Chart */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  7-Day Velocity Trend
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tasks completed vs tasks created over the last 7 days
                </p>
              </div>
            </div>
            <CompletionTrendChart data={trend} />
          </div>
        </div>

        {/* Right 1 Col: Status Distribution + Live Activity */}
        <div className="space-y-6">
          {/* Status Breakdown */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Task Breakdown
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Current state of all tasks
            </p>
            <StatusDistributionChart data={statusDistribution} />
          </div>

          {/* Recent Live Activity */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Recent Activity
              </h3>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No recent actions logged yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="text-xs flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-800 dark:text-zinc-200 font-medium truncate">
                        {log.action.replace('task_', '').replace('_', ' ').toUpperCase()}:{' '}
                        <span className="font-normal text-zinc-600 dark:text-zinc-400">
                          {log.metadata?.taskTitle || 'Task'}
                        </span>
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        {formatRelativeDate(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          users={users}
        />
      )}
    </div>
  );
};
