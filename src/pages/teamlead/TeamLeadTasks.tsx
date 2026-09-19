import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamLead } from '@/hooks/useTeamLead';
import { useUsers } from '@/hooks/useUsers';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { updateTaskStatus } from '@/services/taskService';
import { useToast } from '@/context/ToastContext';
import { Task, TaskStatus } from '@/types/task';
import { formatDate } from '@/utils/date';
import {
  CheckSquare, Search, Plus, Clock, CheckCircle2,
  AlertCircle, Loader2, ArrowUpDown, User,
} from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  todo: { label: 'To Do', icon: <Clock className="w-3 h-3" />, color: 'text-zinc-500' },
  in_progress: { label: 'In Progress', icon: <Loader2 className="w-3 h-3 animate-spin" />, color: 'text-blue-500' },
  completed: { label: 'Done', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-500' },
};

export const TeamLeadTasks: React.FC = () => {
  const { user, profile } = useAuth();
  const { teamMembers, teamMembersMap, leadTasks, loading } = useTeamLead();
  const { users } = useUsers();
  const { success, error: showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return leadTasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterAssignee !== 'all') {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        if (!assignees.includes(filterAssignee)) return false;
      }
      return true;
    });
  }, [leadTasks, search, filterStatus, filterPriority, filterAssignee]);

  const handleStatusCycle = async (task: Task) => {
    if (!user) return;
    const cycle: Record<TaskStatus, TaskStatus> = {
      todo: 'in_progress',
      in_progress: 'completed',
      completed: 'todo',
    };
    const next = cycle[task.status];
    setUpdatingId(task.id);
    try {
      await updateTaskStatus(task.id, next, task, user.uid, profile?.name || 'Team Lead');
      success(`Task moved to "${STATUS_CONFIG[next].label}"`);
    } catch (err: any) {
      showError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Only team members are valid assignees for team lead task modal
  const teamMemberUsers = users.filter((u) => teamMembers.some((m) => m.uid === u.uid));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" /> Task Assignment
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Assign and track tasks for your team members
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
          disabled={teamMembers.length === 0}
        >
          Assign Task
        </Button>
      </div>

      {teamMembers.length === 0 && !loading && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ No team members are assigned to you yet. Ask an admin to set <code>reportsTo</code> field for your team members.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[180px]">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-36">
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Done</option>
        </Select>
        <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-36">
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
        <Select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="w-40">
          <option value="all">All Members</option>
          {teamMembers.map((m) => (
            <option key={m.uid} value={m.uid}>{m.name}</option>
          ))}
        </Select>
        <span className="text-xs text-zinc-400 whitespace-nowrap">{filtered.length} tasks</span>
      </div>

      {/* Tasks Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-4 min-w-[220px]">Task</th>
              <th className="py-3 px-3 min-w-[100px]">Assignee</th>
              <th className="py-3 px-3 min-w-[80px]">Priority</th>
              <th className="py-3 px-3 min-w-[100px]">Status</th>
              <th className="py-3 px-4 min-w-[110px]">Deadline</th>
              <th className="py-3 px-4 text-right min-w-[90px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-zinc-400">
                  {leadTasks.length === 0
                    ? 'No tasks assigned yet. Click "Assign Task" to get started.'
                    : 'No tasks match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((task) => {
                const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
                const firstAssignee = teamMembersMap.get(assignees[0]);
                const isOverdue = task.status !== 'completed' &&
                  new Date(task.deadline?.seconds ? task.deadline.seconds * 1000 : task.deadline) < new Date();
                const status = STATUS_CONFIG[task.status];
                return (
                  <tr key={task.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-900 dark:text-white text-xs truncate max-w-[200px]">{task.title}</p>
                      {task.description && (
                        <p className="text-[10px] text-zinc-400 truncate max-w-[200px] mt-0.5">{task.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {firstAssignee?.name?.charAt(0) || <User className="w-3 h-3" />}
                        </div>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[80px]">
                          {firstAssignee?.name || 'Unknown'}
                          {assignees.length > 1 && <span className="text-zinc-400"> +{assignees.length - 1}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
                        {status.icon}
                        <span>{status.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs ${isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-500'}`}>
                        {isOverdue && '⚠ '}
                        {formatDate(task.deadline)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleStatusCycle(task)}
                        disabled={updatingId === task.id}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      >
                        {updatingId === task.id ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : (
                          <>Next →</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Task Modal — only team members as valid assignees */}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          users={teamMemberUsers.length > 0 ? teamMemberUsers : users}
        />
      )}
    </div>
  );
};
