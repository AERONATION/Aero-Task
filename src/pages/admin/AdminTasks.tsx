import React, { useState } from 'react';
import { useAdminTasks } from '@/hooks/useAdminTasks';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { TEAMS } from '@/types/user';
import { updateTaskStatus, deleteTask } from '@/services/taskService';
import { useToast } from '@/context/ToastContext';
import { Plus, Search, Filter, RotateCcw } from 'lucide-react';

export const AdminTasks: React.FC = () => {
  const { tasks, allTasks, loading: tasksLoading, filters, setFilters } = useAdminTasks();
  const { users, usersMap, loading: usersLoading } = useUsers();
  const { user, profile } = useAuth();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
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
        profile?.name || user.displayName || 'Admin'
      );
      success(`Task status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !user) return;
    try {
      await deleteTask(taskToDelete.id, user.uid, taskToDelete.title);
      success('Task deleted successfully');
      setTaskToDelete(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete task');
    }
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      team: 'all',
      assignedTo: 'all',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Global Task Management
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Full view of company-wide tasks, reassignments, scheduling, and progress
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
          Create & Assign Task
        </Button>
      </div>

      {/* Multi-Filter Controls */}
      <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by title, description..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Team Filter */}
          <div>
            <Select
              value={filters.team || 'all'}
              onChange={(e) => setFilters({ ...filters, team: e.target.value })}
            >
              <option value="all">All Departments</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          {/* User Filter */}
          <div>
            <Select
              value={filters.assignedTo || 'all'}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
            >
              <option value="all">All Team Members</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={filters.status || 'all'}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value as TaskStatus | 'all' })
              }
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </div>
        </div>

        {/* Secondary row: Priority, Sort, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Priority */}
            <div className="w-36">
              <Select
                value={filters.priority || 'all'}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value as TaskPriority | 'all' })
                }
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
            </div>

            {/* Sort by */}
            <div className="w-40">
              <Select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                options={[
                  { value: 'createdAt', label: 'Sort by Created' },
                  { value: 'deadline', label: 'Sort by Deadline' },
                  { value: 'priority', label: 'Sort by Priority' },
                  { value: 'title', label: 'Sort by Title' },
                ]}
              />
            </div>

            {/* Sort order */}
            <div className="w-32">
              <Select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
                options={[
                  { value: 'desc', label: 'Descending' },
                  { value: 'asc', label: 'Ascending' },
                ]}
              />
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-zinc-400">
        Showing <strong>{tasks.length}</strong> of <strong>{allTasks.length}</strong> company tasks
      </div>

      {/* Tasks Table / Cards */}
      {tasksLoading ? (
        <div className="p-8 text-center border rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <div className="space-y-3">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-1/2 mx-auto" />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks match the active filters"
          description="Try broadening your search query or resetting filters."
          actionText="Clear Filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <TaskTable
              tasks={tasks}
              usersMap={usersMap}
              showAssignee={true}
              onStatusChange={handleStatusChange}
              onEdit={(t) => {
                setActiveTask(t);
                setIsModalOpen(true);
              }}
              onDelete={(t) => setTaskToDelete(t)}
            />
          </div>

          <div className="md:hidden space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignedUser={usersMap.get(task.assignedTo)}
                onStatusChange={handleStatusChange}
                onEdit={(t) => {
                  setActiveTask(t);
                  setIsModalOpen(true);
                }}
                onDelete={(t) => setTaskToDelete(t)}
              />
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Modal with User Assignment */}
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

      {/* Delete Confirmation */}
      {taskToDelete && (
        <ConfirmDialog
          isOpen={!!taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be reversed.`}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
