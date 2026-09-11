import React from 'react';
import { Task, TaskStatus } from '@/types/task';
import { UserProfile } from '@/types/user';
import { Badge } from '@/components/ui/Badge';
import { DeadlineBadge } from './DeadlineBadge';
import { formatDate } from '@/utils/date';
import { CheckCircle2, Clock, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  assignedUser?: UserProfile;
  creatorUser?: UserProfile;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  detailUrlPrefix?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assignedUser,
  onStatusChange,
  onEdit,
  onDelete,
  detailUrlPrefix = '/user/tasks',
}) => {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="status" status={task.status} />
          <Badge variant="priority" priority={task.priority} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Edit Task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <Link
          to={`${detailUrlPrefix}/${task.id}`}
          className="group flex items-center justify-between"
        >
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
            {task.title}
          </h4>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        {task.description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DeadlineBadge task={task} />
        </div>

        <div className="flex items-center gap-1.5">
          {task.status !== 'in_progress' && task.status !== 'completed' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="text-xs font-medium px-2 py-1 rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors inline-flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Start</span>
            </button>
          )}

          {task.status !== 'completed' && (
            <button
              onClick={() => onStatusChange(task.id, 'completed')}
              className="text-xs font-medium px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Done</span>
            </button>
          )}

          {task.status === 'completed' && (
            <button
              onClick={() => onStatusChange(task.id, 'todo')}
              className="text-xs font-medium px-2 py-1 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 transition-colors"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {assignedUser && (
        <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Assigned to {assignedUser.name}</span>
          {task.team && <span className="font-mono">{task.team}</span>}
        </div>
      )}
    </div>
  );
};
