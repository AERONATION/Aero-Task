import React, { useState, useEffect } from 'react';
import { useAdminTasks } from '@/hooks/useAdminTasks';
import { useUsers } from '@/hooks/useUsers';
import { usePerformance } from '@/hooks/usePerformance';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { DeadlineBadge } from '@/components/tasks/DeadlineBadge';
import { TaskModal } from '@/components/tasks/TaskModal';
import { subscribeRecentActivity } from '@/services/taskService';
import { ActivityLog } from '@/types/task';
import { formatRelativeDate } from '@/utils/date';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Shield,
  Activity,
  Plus,
} from 'lucide-react';
import {
  TeamPerformanceChart,
  CompletionTrendChart,
  StatusDistributionChart,
} from '@/components/charts/PerformanceCharts';

export const AdminDashboard: React.FC = () => {
  const { allTasks, loading: tasksLoading } = useAdminTasks();
  const { users, loading: usersLoading } = useUsers();
  const { metrics, trend, statusDistribution, teamPerformance } = usePerformance(
    allTasks,
    users,
    30
  );
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeRecentActivity((logs) => {
      setRecentActivity(logs.slice(0, 8));
    }, 15);
    return () => unsub();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive !== false).length;

  // Upcoming global deadlines
  const upcomingDeadlines = allTasks
    .filter((t) => t.status !== 'completed')
    .slice(0, 6);

  const loading = tasksLoading || usersLoading;

  return (
    <div className="space-y-6 text-left">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Organization Command Center
            </h2>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold">
              Admin
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Real-time operations, company-wide delivery metrics, and department throughput
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/tasks">
            <button className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs transition-colors">
              Manage All Tasks
            </button>
          </Link>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create & Assign</span>
          </button>
        </div>
      </div>

      {/* 10 Core Stat Metrics Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Users */}
          <Link
            to="/admin/users"
            className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors block"
          >
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Total Members</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {totalUsers}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Registered staff</div>
          </Link>

          {/* Active Users */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Active Members</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeUsers}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Eligible assignees</div>
          </div>

          {/* Total Tasks */}
          <Link
            to="/admin/tasks"
            className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors block"
          >
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Total Tasks</span>
              <Briefcase className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {metrics.totalTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">All company tasks</div>
          </Link>

          {/* Completed Tasks */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.completedTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Resolved deliverables</div>
          </div>

          {/* Overdue Tasks */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Overdue Tasks</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.overdueTasks}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Action needed</div>
          </div>

          {/* Completion Rate */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Completion Rate</span>
              <TrendingUp className="w-4 h-4 text-brand-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
              {metrics.completionRate}%
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">Delivery ratio</div>
          </div>
        </div>
      )}

      {/* Main Center Grid: Team Performance + 30-Day Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Team Performance Bar Chart & Upcoming Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Breakdown Bar Chart */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Team Performance & Output
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Completed vs pending workload distributed across all 7 departments
                </p>
              </div>
              <Link
                to="/admin/teams"
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
              >
                Team details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <TeamPerformanceChart data={teamPerformance} />
          </div>

          {/* Global Upcoming Deadlines */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Company-Wide Impending Deadlines
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Open tasks across all teams approaching their deadlines
                </p>
              </div>
              <Link
                to="/admin/tasks"
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
              >
                View directory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No active tasks with pending deadlines.</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {upcomingDeadlines.map((task) => {
                  const assignee = users.find((u) => u.uid === task.assignedTo);
                  return (
                    <div
                      key={task.id}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 px-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/user/tasks/${task.id}`}
                          className="text-xs font-semibold text-zinc-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 truncate block"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Assigned to <strong>{assignee?.name || 'Unassigned'}</strong>
                          </span>
                          {task.team && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {task.team}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <DeadlineBadge task={task} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Status Distribution + Organization Audit Stream */}
        <div className="space-y-6">
          {/* Org Status Distribution */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Global Task Distribution
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Current breakdown of all {metrics.totalTasks} organization tasks
            </p>
            <StatusDistributionChart data={statusDistribution} />
          </div>

          {/* Real-time Activity Stream */}
          <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Live Audit Stream
              </h3>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No platform activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
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

      {/* Task Modal for Admin Assignment */}
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
