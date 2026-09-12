import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getTaskById,
  subscribeTaskById,
  updateTaskStatus,
  deleteTask,
  subscribeTaskLogs,
  toggleTaskChecklistItem,
  updateTaskChecklist,
} from '@/services/taskService';
import { getUserProfile, getAllUsers } from '@/services/userService';
import { Task, ActivityLog, TaskStatus, ChecklistItem } from '@/types/task';
import { UserProfile } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { DeadlineBadge } from '@/components/tasks/DeadlineBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskModal } from '@/components/tasks/TaskModal';
import { ApiChecklist } from '@/components/tasks/ApiChecklist';
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
  Users,
  Shield,
  History,
  AlertOctagon,
  Code2,
} from 'lucide-react';

export const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [assignees, setAssignees] = useState<UserProfile[]>([]);
  const [creator, setCreator] = useState<UserProfile | null>(null);
  const [assigner, setAssigner] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    // 1. Initial full fetch & profile hydration
    const loadTaskData = async () => {
      setLoading(true);
      try {
        const fetchedTask = await getTaskById(taskId);
        if (!fetchedTask) {
          error('Task not found');
          navigate(isAdmin ? '/admin/tasks' : '/user/tasks');
          return;
        }
        setTask(fetchedTask);

        // Fetch user profiles for all assignees
        if (fetchedTask.assignedTo && fetchedTask.assignedTo.length > 0) {
          const profiles = await Promise.all(
            fetchedTask.assignedTo.map((uid) => getUserProfile(uid))
          );
          setAssignees(profiles.filter(Boolean) as UserProfile[]);
        } else {
          setAssignees([]);
        }

        // Fetch creator
        let creatorProfile: UserProfile | null = null;
        if (fetchedTask.createdBy) {
          creatorProfile = await getUserProfile(fetchedTask.createdBy);
          setCreator(creatorProfile);
        }

        // Fetch assigner (if assignedBy is set)
        if (fetchedTask.assignedBy) {
          const ass = await getUserProfile(fetchedTask.assignedBy);
          setAssigner(ass);
        } else if (creatorProfile) {
          setAssigner(creatorProfile);
        }

        // Load all users for edit modal if admin
        if (isAdmin) {
          const uList = await getAllUsers();
          setAllUsers(uList);
        }
      } catch (err: any) {
        console.error('Failed to load task:', err);
        error('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    loadTaskData();

    // 2. Real-time subscription to task changes (checklist ticks, status changes)
    const unsubTask = subscribeTaskById(taskId, (updatedTask) => {
      if (updatedTask) {
        setTask(updatedTask);
      }
    });

    // 3. Subscribe to task activity logs
    const unsubLogs = subscribeTaskLogs(taskId, (activity) => {
      setLogs(activity);
    });

    return () => {
      unsubTask();
      unsubLogs();
    };
  }, [taskId, navigate, isAdmin]);

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

  const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
    if (!task || !user) return;

    // Optimistic UI update so the checkbox ticks instantly
    const prevChecklist = task.checklist || [];
    const optimisticList = prevChecklist.map((item) =>
      item.id === itemId
        ? {
            ...item,
            completed,
            completedBy: completed ? user.uid : null,
            completedByName: completed ? (profile?.name || user.displayName || 'User') : null,
            completedAt: completed ? new Date().toISOString() : null,
          }
        : item
    );
    setTask((prev) => (prev ? { ...prev, checklist: optimisticList } : null));

    try {
      const updatedChecklist = await toggleTaskChecklistItem(
        task.id,
        itemId,
        completed,
        user.uid,
        profile?.name || user.displayName || 'User'
      );
      setTask((prev) => (prev ? { ...prev, checklist: updatedChecklist } : null));
      success(completed ? 'Item marked as completed' : 'Item unchecked');
    } catch (err: any) {
      console.error('Failed to toggle checklist item:', err);
      // Revert optimistic update on failure
      setTask((prev) => (prev ? { ...prev, checklist: prevChecklist } : null));
      error(err.message || 'Failed to update test checklist item');
    }
  };

  const handleUpdateChecklistStructure = async (items: ChecklistItem[]) => {
    if (!task || !user) return;
    try {
      await updateTaskChecklist(
        task.id,
        items,
        user.uid,
        profile?.name || user.displayName || 'User'
      );
      setTask((prev) => (prev ? { ...prev, checklist: items } : null));
      success('Checklist endpoints updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update checklist');
    }
  };

  const handleDelete = async () => {
    if (!task || !user || !isAdmin) return;
    setDeleteLoading(true);
    try {
      await deleteTask(task.id, user.uid, task.title);
      success('Task deleted successfully');
      navigate(isAdmin ? '/admin/tasks' : '/user/tasks');
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

  const isAssigner = Boolean(
    user && (
      isAdmin ||
      task.createdBy === user.uid ||
      task.assignedBy === user.uid ||
      (user.email && (task.createdBy === user.email || task.assignedBy === user.email)) ||
      (profile?.email && (task.createdBy === profile.email || task.assignedBy === profile.email))
    )
  );
  const isAssignee = Boolean(
    user && (
      (Array.isArray(task.assignedTo) && (
        task.assignedTo.includes(user.uid) ||
        (user.email && task.assignedTo.includes(user.email)) ||
        (profile?.email && task.assignedTo.includes(profile.email)) ||
        (profile?.uid && task.assignedTo.includes(profile.uid))
      )) ||
      (task.assignedTo as any) === user.uid ||
      (user.email && (task.assignedTo as any) === user.email) ||
      (profile?.email && (task.assignedTo as any) === profile?.email)
    )
  );
  const canEdit = isAssigner;
  const canDelete = isAdmin;
  // Anyone authenticated who can view the task can toggle/tick items
  const canToggleChecklist = Boolean(user && (isAdmin || isAssigner || isAssignee || true));

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

        {/* Metadata Details Grid with Multiple Assignees & Assigner Designation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {/* Multiple Assignees Display */}
          <div>
            <span className="text-zinc-400 block mb-1 font-medium">
              Assigned To ({assignees.length || task.assignedTo?.length || 0})
            </span>
            {assignees.length === 0 ? (
              <span className="font-medium text-zinc-400">Unassigned</span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {assignees.map((a) => (
                  <div
                    key={a.uid}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-[11px]"
                    title={`${a.name} (${a.designation || a.team || a.email})`}
                  >
                    <div className="w-4 h-4 rounded-full bg-brand-200 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-[9px] flex items-center justify-center">
                      {a.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[110px] leading-tight">{a.name}</span>
                      {(a.designation || a.team) && (
                        <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[110px]">
                          {a.designation || a.team}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned By with Designation */}
          <div>
            <span className="text-zinc-400 block mb-1 font-medium">Assigned By</span>
            <div className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200">
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-amber-200 dark:border-amber-800">
                {(assigner?.name || creator?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-white leading-tight truncate">
                  {assigner?.name || creator?.name || 'Admin'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400 font-mono">
                    {assigner?.designation ||
                      assigner?.team ||
                      creator?.designation ||
                      creator?.team ||
                      (creator?.systemRole === 'admin' ? 'Administrator' : 'Team Lead')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1 font-medium">Created Date</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatDate(task.createdAt, true)}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1 font-medium">Deadline</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatDate(task.deadline)}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive API Checklist Section */}
      <ApiChecklist
        items={task.checklist || []}
        onToggleItem={handleToggleChecklistItem}
        onUpdateItems={isAdmin ? handleUpdateChecklistStructure : undefined}
        readOnly={!canToggleChecklist}
        canEditStructure={isAdmin}
        title="API Testing Checklist & Endpoints"
        description="Verify endpoints, toggle completion status, and monitor team progress in real time"
      />

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
                    {log.action.replace('task_', '').replace('checklist_', 'API: ').replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formatRelativeDate(log.timestamp)}
                  </span>
                </div>
                {log.metadata?.itemTitle && (
                  <p className="text-zinc-600 dark:text-zinc-300 font-mono text-[11px] mt-0.5">
                    {log.metadata.itemTitle} - {log.metadata.completed ? 'COMPLETED' : 'UNCHECKED'} ({log.metadata.progress})
                  </p>
                )}
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
          users={allUsers.length > 0 ? allUsers : assignees}
          onSuccess={async () => {
            if (taskId) {
              const updated = await getTaskById(taskId);
              if (updated) {
                setTask(updated);
                if (updated.assignedTo && updated.assignedTo.length > 0) {
                  const profiles = await Promise.all(
                    updated.assignedTo.map((uid) => getUserProfile(uid))
                  );
                  setAssignees(profiles.filter(Boolean) as UserProfile[]);
                }
              }
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
