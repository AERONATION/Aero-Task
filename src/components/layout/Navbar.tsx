import React, { useState } from 'react';
import { Menu, Plus, User, Search } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/Button';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, title }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const { users } = useUsers();

  return (
    <header className="h-14 px-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          size="sm"
          onClick={() => setIsTaskModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
          className="hidden sm:inline-flex"
        >
          New Task
        </Button>

        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="sm:hidden p-2 rounded-lg bg-brand-600 text-white shadow-xs"
          title="Create Task"
        >
          <Plus className="w-4 h-4" />
        </button>

        <NotificationBell />

        <Link
          to="/user/profile"
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="View Profile"
        >
          <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center text-xs font-semibold">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
        </Link>
      </div>

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          users={isAdmin ? users : []}
        />
      )}
    </header>
  );
};
