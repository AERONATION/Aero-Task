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
  Code2,
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  usersMap?: Map<string, UserProfile>;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  canEditTask?: (task: Task) => boolean;
  detailUrlPrefix?: string;
  showAssignee?: boolean;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  usersMap = new Map(),
  onStatusChange,
  onEdit,
  onDelete,
  canEditTask,
  detailUrlPrefix = '/user/tasks',
  showAssignee = true,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs text-left">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="py-3 px-4 min-w-[240px]">Task</th>
            {showAssignee && <th className="py-3 px-4 min-w-[160px]">Assigned To</th>}
            <th className="py-3 px-4 min-w-[120px]">Checklist</th>
            <th className="py-3 px-4 min-w-[110px]">Team</th>
            <th className="py-3 px-4 min-w-[100px]">Priority</th>
            <th className="py-3 px-4 min-w-[130px]">Status</th>
            <th className="py-3 px-4 min-w-[140px]">Deadline</th>
            <th className="py-3 px-4 text-right min-w-[110px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {tasks.map((task) => {
            const assigneeUids: string[] = Array.isArray(task.assignedTo)
              ? task.assignedTo
              : task.assignedTo
              ? [task.assignedTo]
              : [];

            const assignedProfiles = assigneeUids
              .map((uid) => usersMap.get(uid))
              .filter(Boolean) as UserProfile[];

            const totalChecklist = task.checklist?.length || 0;
            const completedChecklist = task.checklist?.filter((i) => i.completed).length || 0;
            const percent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

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
                    {(() => {
                      const assigner = usersMap.get(task.assignedBy || task.createdBy);
                      if (!assigner) return null;
                      return (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                          <span>By:</span>
                          <span className="font-medium text-zinc-600 dark:text-zinc-400">{assigner.name}</span>
                          {(assigner.designation || assigner.team) && (
                            <span className="text-brand-600 dark:text-brand-400 font-mono">
                              ({assigner.designation || assigner.team})
                            </span>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                </td>

                {/* Multiple Assignees */}
                {showAssignee && (
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {assignedProfiles.length === 0 ? (
                      <span className="text-xs text-zinc-400">Unassigned</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {assignedProfiles.slice(0, 3).map((u) => (
                            <div
                              key={u.uid}
                              title={`${u.name} (${u.team || 'No team'})`}
                              className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-zinc-900"
                            >
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[110px]">
                          {assignedProfiles.length === 1
                            ? assignedProfiles[0].name
                            : `${assignedProfiles[0].name} +${assignedProfiles.length - 1}`}
                        </span>
                      </div>
                    )}
                  </td>
                )}

                {/* API Checklist Progress Indicator */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {totalChecklist > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full ${percent === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {completedChecklist}/{totalChecklist}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 text-xs">—</span>
                  )}
                </td>

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
                    {onEdit && (!canEditTask || canEditTask(task)) && (
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(task)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
