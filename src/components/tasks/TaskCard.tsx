import React from 'react';
import { Task, TaskStatus } from '@/types/task';
import { UserProfile } from '@/types/user';
import { Badge } from '@/components/ui/Badge';
import { DeadlineBadge } from './DeadlineBadge';
import { formatDate } from '@/utils/date';
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  Code2,
  Users,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  assignedUser?: UserProfile;
  assignedUsers?: UserProfile[];
  usersMap?: Map<string, UserProfile>;
  creatorUser?: UserProfile;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onRemind?: (task: Task) => void;
  detailUrlPrefix?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assignedUser,
  assignedUsers,
  usersMap = new Map(),
  onStatusChange,
  onEdit,
  onDelete,
  onRemind,
  detailUrlPrefix = '/user/tasks',
}) => {
  // Normalize assignees list
  const assigneeUids: string[] = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
    ? [task.assignedTo]
    : [];

  const resolvedUsers: UserProfile[] =
    assignedUsers ||
    assigneeUids
      .map((uid) => usersMap.get(uid) || (assignedUser?.uid === uid ? assignedUser : null))
      .filter(Boolean) as UserProfile[];

  // Checklist calculations
  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter((i) => i.completed).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="status" status={task.status} />
          <Badge variant="priority" priority={task.priority} />
          {task.team && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {task.team}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRemind && task.status !== 'completed' && (
            <button
              onClick={() => onRemind(task)}
              className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Send Reminder Email & Alert"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
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
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
        </Link>
        {task.description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Mini API Checklist Progress Bar if task has checklist */}
      {totalChecklist > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <Code2 className="w-3 h-3 text-brand-500" />
              <span>APIs Tested</span>
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400">
              {completedChecklist}/{totalChecklist} ({checklistPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                checklistPercent === 100 ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
              style={{ width: `${checklistPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Deadline & Quick Actions */}
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

      {/* Multi-Assignee Avatar Cluster / Names */}
      {resolvedUsers.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-zinc-50 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5 overflow-hidden">
              {resolvedUsers.slice(0, 3).map((u) => (
                <div
                  key={u.uid}
                  title={`${u.name} (${u.designation || u.team || 'Member'})`}
                  className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-[9px] flex items-center justify-center border-2 border-white dark:border-zinc-900"
                >
                  {u.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              ))}
            </div>
            <span className="truncate max-w-[140px]">
              {resolvedUsers.length === 1
                ? resolvedUsers[0].name
                : `${resolvedUsers[0].name} +${resolvedUsers.length - 1}`}
            </span>
          </div>

          {task.team && <span className="font-mono text-[10px]">{task.team}</span>}
        </div>
      )}

      {/* Assigner / Creator Info with Designation */}
      {(() => {
        const assignerUid = task.assignedBy || task.createdBy;
        const assigner = assignerUid ? usersMap.get(assignerUid) : null;
        if (!assigner) return null;
        return (
          <div className="mt-1.5 pt-1.5 border-t border-zinc-50 dark:border-zinc-800/40 text-[10px] text-zinc-400 flex items-center gap-1 truncate">
            <span>Assigned by:</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              {assigner.name}
            </span>
            {(assigner.designation || assigner.team) && (
              <span className="text-brand-600 dark:text-brand-400 font-mono text-[9px] truncate">
                • {assigner.designation || assigner.team}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
};
