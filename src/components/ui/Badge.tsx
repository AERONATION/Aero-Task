import React from 'react';
import { cn } from '@/utils/cn';
import { TaskPriority, TaskStatus } from '@/types/task';
import { Circle, Clock, CheckCircle2, AlertOctagon, Flame } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'status' | 'priority';
  status?: TaskStatus;
  priority?: TaskPriority;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  priority,
  size = 'sm',
  children,
  ...props
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (variant === 'status' && status) {
    const statusConfig = {
      todo: {
        label: 'To Do',
        color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700',
        icon: <Circle className="w-2.5 h-2.5 text-zinc-500 fill-zinc-500/20" />,
      },
      in_progress: {
        label: 'In Progress',
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        icon: <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" />,
      },
      completed: {
        label: 'Completed',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
        icon: <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />,
      },
    };

    const current = statusConfig[status];
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-md border tracking-wide uppercase font-mono text-[10px]',
          sizeClasses,
          current.color,
          className
        )}
        {...props}
      >
        {current.icon}
        <span>{children || current.label}</span>
      </span>
    );
  }

  if (variant === 'priority' && priority) {
    const priorityConfig = {
      low: {
        label: 'Low',
        color: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700',
        icon: null,
      },
      medium: {
        label: 'Medium',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
        icon: null,
      },
      high: {
        label: 'High',
        color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
        icon: <Flame className="w-3 h-3 text-orange-500" />,
      },
      urgent: {
        label: 'Urgent',
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70 font-semibold',
        icon: <AlertOctagon className="w-3 h-3 text-rose-500" />,
      },
    };

    const current = priorityConfig[priority];
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-md border text-[11px]',
          sizeClasses,
          current.color,
          className
        )}
        {...props}
      >
        {current.icon}
        <span>{children || current.label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
