import React from 'react';
import { Task } from '@/types/task';
import { getDeadlineInfo } from '@/utils/date';
import { cn } from '@/utils/cn';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';

interface DeadlineBadgeProps {
  task: Task;
  className?: string;
  showIcon?: boolean;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({
  task,
  className,
  showIcon = true,
}) => {
  const info = getDeadlineInfo(task);

  const styleMap = {
    completed_on_time: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
    },
    completed_late: {
      bg: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      icon: <CalendarCheck className="w-3 h-3 text-zinc-500" />,
    },
    overdue: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70 font-semibold',
      icon: <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
    due_today: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/70 font-semibold',
      icon: <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    },
    due_tomorrow: {
      bg: 'bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50',
      icon: <Clock className="w-3 h-3 text-amber-500" />,
    },
    due_soon: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
      icon: <Clock className="w-3 h-3 text-blue-500" />,
    },
    upcoming: {
      bg: 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700',
      icon: <Calendar className="w-3 h-3 text-zinc-400" />,
    },
  };

  const current = styleMap[info.state];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs tracking-tight select-none',
        current.bg,
        className
      )}
      title={info.label}
    >
      {showIcon && current.icon}
      <span>{info.label}</span>
    </span>
  );
};
