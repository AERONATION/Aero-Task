import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserRole, toggleUserActiveStatus } from '@/services/userService';
import { useAdminTasks } from '@/hooks/useAdminTasks';
import { usePerformance } from '@/hooks/usePerformance';
import { UserProfile } from '@/types/user';
import { Task, ActivityLog, TaskStatus } from '@/types/task';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { formatDate, formatRelativeDate } from '@/utils/date';
import { updateTaskStatus, deleteTask, subscribeRecentActivity } from '@/services/taskService';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  Calendar,
  Shield,
  Plus,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  CompletionTrendChart,
  StatusDistributionChart,
  OnTimeVsLateChart,
} from '@/components/charts/PerformanceCharts';

export const AdminUserDetail: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [member, setMember] = useState<UserProfile | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const { allTasks } = useAdminTasks();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      setLoadingMember(true);
      try {
        const u = await getUserProfile(uid);
        if (!u) {
          error('User not found');
          navigate('/admin/users');
          return;
        }
        setMember(u);
      } catch (err: any) {
        error(err.message || 'Failed to fetch user');
      } finally {
        setLoadingMember(false);
      }
    };

    fetchUser();

    const unsub = subscribeRecentActivity((logs) => {
      const filtered = logs.filter((l) => l.userId === uid || l.metadata?.assignedTo === uid);
      setRecentLogs(filtered.slice(0, 6));
    }, 20);

    return () => unsub();
  }, [uid, navigate]);

  // Tasks assigned to this specific user
  const userTasks = allTasks.filter((t) => t.assignedTo === uid);
  const { metrics, trend, statusDistribution, onTimeVsLate } = usePerformance(
    userTasks,
    member ? [member] : [],
    30
  );

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = userTasks.find((t) => t.id === taskId);
    if (!task || !uid) return;
    try {
      await updateTaskStatus(taskId, newStatus, task, uid, member?.name || 'User');
      success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      error(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !uid) return;
    try {
      await deleteTask(taskToDelete.id, uid, taskToDelete.title);
      success('Task deleted');
      setTaskToDelete(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete task');
    }
  };

  if (loadingMember) {
    return (
      <div className="py-12 text-center text-zinc-400">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mx-auto animate-pulse mb-4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mx-auto animate-pulse" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="space-y-6 text-left">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Member Directory</span>
        </Link>

        <Button
          size="sm"
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Assign Task
        </Button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-bold text-2xl flex items-center justify-center shrink-0">
              {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {member.name}
                </h3>
                <span
                  className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded ${
                    member.systemRole === 'admin'
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {member.systemRole === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{member.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {member.team || 'No Department'}
                </span>
                <span>•</span>
                <span>{member.designation || 'Staff'}</span>
                <span>•</span>
                <span>Last active {formatRelativeDate(member.lastLoginAt || member.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const newRole = member.systemRole === 'admin' ? 'user' : 'admin';
                await updateUserRole(member.uid, newRole);
                setMember({ ...member, systemRole: newRole });
                success(`Role changed to ${newRole}`);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              {member.systemRole === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Total Tasks</div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {metrics.totalTasks}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Completed</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.completedTasks}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Pending / Active</div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics.pendingTasks + metrics.inProgressTasks}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Overdue</div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics.overdueTasks}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Completion Rate</div>
          <div className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
            {metrics.completionRate}%
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Avg Turnaround</div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {metrics.averageCompletionTimeFormatted}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Task Velocity & Output
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            30-day view of completed vs assigned tasks
          </p>
          <CompletionTrendChart data={trend} />
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Schedule Reliability
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Tasks completed on-time vs delivered past deadline
          </p>
          <OnTimeVsLateChart data={onTimeVsLate} />
        </div>
      </div>

      {/* Task History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Task History & Assignments ({userTasks.length})
          </h4>
        </div>

        {userTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 border border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40">
            No tasks currently assigned to this user.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <TaskTable
                tasks={userTasks}
                showAssignee={false}
                onStatusChange={handleStatusChange}
                onEdit={(t) => {
                  setTaskToEdit(t);
                  setIsTaskModalOpen(true);
                }}
                onDelete={(t) => setTaskToDelete(t)}
              />
            </div>
            <div className="md:hidden space-y-3">
              {userTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onEdit={(task) => {
                    setTaskToEdit(task);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={(task) => setTaskToDelete(task)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assign Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
          task={taskToEdit}
          users={member ? [member] : []}
        />
      )}

      {/* Delete Confirmation */}
      {taskToDelete && (
        <ConfirmDialog
          isOpen={!!taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          message={`Are you sure you want to permanently delete "${taskToDelete.title}"?`}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
