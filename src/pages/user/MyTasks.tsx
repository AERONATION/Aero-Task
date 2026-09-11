import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { updateTaskStatus, deleteTask } from '@/services/taskService';
import { useToast } from '@/context/ToastContext';
import {
  Plus,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Circle,
  Layers,
} from 'lucide-react';

export const MyTasks: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const { tasks, allTasks, loading, filters, setFilters } = useTasks();
  const { users, usersMap } = useUsers();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { success, error } = useToast();

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || !user) return;

    try {
      await updateTaskStatus(
        taskId,
        newStatus,
        task,
        user.uid,
        profile?.name || user.displayName || 'User'
      );
      success(`Task status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete || !user || !isAdmin) return;
    setActionLoading(true);
    try {
      await deleteTask(taskToDelete.id, user.uid, taskToDelete.title);
      success('Task deleted successfully');
      setTaskToDelete(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete task');
    } finally {
      setActionLoading(false);
    }
  };

  // Status counts for tab chips
  const totalCount = allTasks.length;
  const todoCount = allTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = allTasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header & New Task Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            My Tasks
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Manage your personal workload, track milestones, and log completions
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setActiveTask(null);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Task
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3">
        {/* Status Tab Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, status: 'all' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              !filters.status || filters.status === 'all'
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <span>All Tasks</span>
            <span className="opacity-75 font-mono text-[10px]">({totalCount})</span>
          </button>

          <button
            onClick={() => setFilters({ ...filters, status: 'todo' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filters.status === 'todo'
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Circle className="w-2.5 h-2.5 text-zinc-400 fill-zinc-400/30" />
            <span>To Do</span>
            <span className="opacity-75 font-mono text-[10px]">({todoCount})</span>
          </button>

          <button
            onClick={() => setFilters({ ...filters, status: 'in_progress' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filters.status === 'in_progress'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-2.5 h-2.5 text-amber-500" />
            <span>In Progress</span>
            <span className="opacity-75 font-mono text-[10px]">({inProgressCount})</span>
          </button>

          <button
            onClick={() => setFilters({ ...filters, status: 'completed' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filters.status === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            <span>Completed</span>
            <span className="opacity-75 font-mono text-[10px]">({completedCount})</span>
          </button>
        </div>

        {/* Search & Priority Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search tasks by keyword..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={filters.priority || 'all'}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value as TaskPriority | 'all' })
              }
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Task List / Table */}
      {loading ? (
        <div className="p-8 text-center border rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <div className="space-y-3">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-1/2 mx-auto" />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title={allTasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
          description={
            allTasks.length === 0
              ? 'Get started by creating your first task. Set deadlines and organize priorities.'
              : 'Try clearing your filters or search keywords to see your tasks.'
          }
          actionText={allTasks.length === 0 ? 'Create First Task' : 'Reset Filters'}
          onAction={() => {
            if (allTasks.length === 0) {
              setActiveTask(null);
              setIsModalOpen(true);
            } else {
              setFilters({});
            }
          }}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <TaskTable
              tasks={tasks}
              usersMap={usersMap}
              showAssignee={false}
              onStatusChange={handleStatusChange}
              canEditTask={(t) => Boolean(user && (isAdmin || t.createdBy === user.uid || t.assignedBy === user.uid))}
              onEdit={(t) => {
                setActiveTask(t);
                setIsModalOpen(true);
              }}
              onDelete={isAdmin ? (t) => setTaskToDelete(t) : undefined}
            />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {tasks.map((task) => {
              const canEditThis = Boolean(
                user && (isAdmin || task.createdBy === user.uid || task.assignedBy === user.uid)
              );
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  usersMap={usersMap}
                  onStatusChange={handleStatusChange}
                  onEdit={
                    canEditThis
                      ? (t) => {
                          setActiveTask(t);
                          setIsModalOpen(true);
                        }
                      : undefined
                  }
                  onDelete={isAdmin ? (t) => setTaskToDelete(t) : undefined}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Task Create/Edit Modal */}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setActiveTask(null);
          }}
          task={activeTask}
          users={users}
        />
      )}

      {/* Confirmation Dialog on Delete */}
      {taskToDelete && (
        <ConfirmDialog
          isOpen={!!taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Task"
          message={`Are you sure you want to permanently delete "${taskToDelete.title}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </div>
  );
};
