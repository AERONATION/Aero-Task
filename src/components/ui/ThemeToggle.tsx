import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = 'md',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
        'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900',
        'dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
        size === 'sm' ? 'p-1.5 text-xs gap-1.5' : size === 'lg' ? 'p-2.5 text-sm gap-2' : 'p-2 text-xs gap-2',
        className
      )}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        <Sun
          className={cn(
            'w-4 h-4 transition-all duration-300 transform',
            isDark
              ? 'rotate-90 scale-0 opacity-0 absolute'
              : 'rotate-0 scale-100 opacity-100 text-amber-500'
          )}
        />
        <Moon
          className={cn(
            'w-4 h-4 transition-all duration-300 transform',
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-indigo-400'
              : '-rotate-90 scale-0 opacity-0 absolute'
          )}
        />
      </div>

      {showLabel && (
        <span className="font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};

export const ThemeSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 gap-1',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
          theme === 'light'
            ? 'bg-white text-zinc-900 shadow-xs font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        )}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
          theme === 'dark'
            ? 'bg-zinc-900 text-white dark:bg-zinc-700 shadow-xs font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        )}
      >
        <Moon className="w-3.5 h-3.5 text-indigo-400" />
        <span>Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
          theme === 'system'
            ? 'bg-white text-zinc-900 dark:bg-zinc-700 dark:text-white shadow-xs font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        )}
      >
        <Monitor className="w-3.5 h-3.5 text-zinc-500" />
        <span>System</span>
      </button>
    </div>
  );
};
