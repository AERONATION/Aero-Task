import React from 'react';
import { Task, TaskStatus } from '@/types/task';
import { UserProfile } from '@/types/user';
import { Badge } from '@/components/ui/Badge';
import { DeadlineBadge } from './DeadlineBadge';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Edit2,
  Trash2,
  ExternalLink,
  User as UserIcon,
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  usersMap?: Map<string, UserProfile>;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  detailUrlPrefix?: string;
  showAssignee?: boolean;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  usersMap = new Map(),
  onStatusChange,
  onEdit,
  onDelete,
  detailUrlPrefix = '/user/tasks',
  showAssignee = true,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="py-3 px-4 min-w-[240px]">Task</th>
            {showAssignee && <th className="py-3 px-4 min-w-[140px]">Assigned To</th>}
            <th className="py-3 px-4 min-w-[130px]">Team</th>
            <th className="py-3 px-4 min-w-[100px]">Priority</th>
            <th className="py-3 px-4 min-w-[130px]">Status</th>
            <th className="py-3 px-4 min-w-[150px]">Deadline</th>
            <th className="py-3 px-4 text-right min-w-[120px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {tasks.map((task) => {
            const assignee = usersMap.get(task.assignedTo);

            return (
              <tr
                key={task.id}
                className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
              >
                {/* Task Title & Description */}
                <td className="py-3.5 px-4">
                  <div className="max-w-md">
                    <Link
                      to={`${detailUrlPrefix}/${task.id}`}
                      className="font-medium text-zinc-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5 line-clamp-1"
                    >
                      <span>{task.title}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity" />
                    </Link>
                    {task.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </td>

                {/* Assignee */}
                {showAssignee && (
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold text-[10px] flex items-center justify-center border border-brand-200 dark:border-brand-800">
                        {assignee?.name ? assignee.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
                      </div>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[110px]">
                        {assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                )}

                {/* Team */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {task.team ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-mono text-[11px]">
                      {task.team}
                    </span>
                  ) : (
                    <span className="text-zinc-400 text-xs">—</span>
                  )}
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge variant="priority" priority={task.priority} />
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="status" status={task.status} />

                    {/* Quick status transition button */}
                    {task.status === 'todo' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'in_progress')}
                        title="Mark in progress"
                        className="p-1 text-zinc-400 hover:text-amber-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'completed')}
                        title="Mark completed"
                        className="p-1 text-zinc-400 hover:text-emerald-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'todo')}
                        title="Reopen task"
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>

                {/* Deadline */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <DeadlineBadge task={task} />
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(task)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
