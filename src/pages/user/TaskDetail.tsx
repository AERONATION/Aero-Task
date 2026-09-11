import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTaskById, updateTaskStatus, deleteTask, subscribeTaskLogs } from '@/services/taskService';
import { getUserProfile } from '@/services/userService';
import { Task, ActivityLog, TaskStatus } from '@/types/task';
import { UserProfile } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { DeadlineBadge } from '@/components/tasks/DeadlineBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskModal } from '@/components/tasks/TaskModal';
import { formatDate, formatRelativeDate } from '@/utils/date';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Edit2,
  Trash2,
  User,
  Shield,
  History,
  AlertOctagon,
} from 'lucide-react';

export const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [assignee, setAssignee] = useState<UserProfile | null>(null);
  const [creator, setCreator] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const loadTaskData = async () => {
      setLoading(true);
      try {
        const fetchedTask = await getTaskById(taskId);
        if (!fetchedTask) {
          error('Task not found');
          navigate('/user/tasks');
          return;
        }
        setTask(fetchedTask);

        // Fetch user profiles for creator and assignee
        if (fetchedTask.assignedTo) {
          const a = await getUserProfile(fetchedTask.assignedTo);
          setAssignee(a);
        }
        if (fetchedTask.createdBy) {
          const c = await getUserProfile(fetchedTask.createdBy);
          setCreator(c);
        }
      } catch (err: any) {
        console.error('Failed to load task:', err);
        error('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    loadTaskData();

    // Subscribe to task activity logs
    const unsub = subscribeTaskLogs(taskId, (activity) => {
      setLogs(activity);
    });

    return () => unsub();
  }, [taskId, navigate]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task || !user) return;
    try {
      await updateTaskStatus(
        task.id,
        newStatus,
        task,
        user.uid,
        profile?.name || user.displayName || 'User'
      );
      setTask({ ...task, status: newStatus });
      success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!task || !user) return;
    setDeleteLoading(true);
    try {
      await deleteTask(task.id, user.uid, task.title);
      success('Task deleted successfully');
      navigate('/user/tasks');
    } catch (err: any) {
      error(err.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-zinc-400">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mx-auto animate-pulse mb-4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mx-auto animate-pulse" />
      </div>
    );
  }

  if (!task) return null;

  const canEdit = isAdmin || task.createdBy === user?.uid || task.assignedTo === user?.uid;
  const canDelete = isAdmin || task.createdBy === user?.uid;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Back Button & Action Toolbar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          to={isAdmin ? '/admin/tasks' : '/user/tasks'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to tasks</span>
        </Link>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Task View Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-6">
        {/* Status, Priority & Deadline header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="status" status={task.status} size="md" />
            <Badge variant="priority" priority={task.priority} size="md" />
            {task.team && (
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {task.team}
              </span>
            )}
          </div>

          <div>
            <DeadlineBadge task={task} />
          </div>
        </div>

        {/* Task Title & Description */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {task.title}
          </h2>
          <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {task.description || (
              <span className="italic text-zinc-400 text-xs">No description provided for this task.</span>
            )}
          </div>
        </div>

        {/* Quick Action State Switcher */}
        <div className="p-3.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Task Progression:
          </span>
          <div className="flex items-center gap-2">
            {task.status !== 'in_progress' && task.status !== 'completed' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
                onClick={() => handleStatusChange('in_progress')}
              >
                Mark In Progress
              </Button>
            )}

            {task.status !== 'completed' && (
              <Button
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => handleStatusChange('completed')}
              >
                Mark Completed
              </Button>
            )}

            {task.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => handleStatusChange('todo')}
              >
                Reopen Task
              </Button>
            )}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-400 block mb-1">Assigned To</span>
            <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
              <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center">
                {assignee?.name?.charAt(0) || 'U'}
              </div>
              <span>{assignee?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Created By</span>
            <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
              <User className="w-4 h-4 text-zinc-400" />
              <span>{creator?.name || 'Teammate'}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Created Date</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatDate(task.createdAt, true)}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Deadline</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatDate(task.deadline)}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Logs & History Timeline */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Activity & Audit Trail
          </h3>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-zinc-400 py-3">No activity records logged for this task yet.</p>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {logs.map((log) => (
              <div key={log.id} className="relative text-xs">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-zinc-900" />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {log.action.replace('task_', '').replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formatRelativeDate(log.timestamp)}
                  </span>
                </div>
                {log.metadata?.actorName && (
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Triggered by {log.metadata.actorName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <TaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={task}
          onSuccess={async () => {
            if (taskId) {
              const updated = await getTaskById(taskId);
              if (updated) setTask(updated);
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
          confirmText="Delete"
          loading={deleteLoading}
        />
      )}
    </div>
  );
};
