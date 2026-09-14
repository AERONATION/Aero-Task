import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  User,
  Users,
  Briefcase,
  Shield,
  Layers,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none',
      isActive
        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
    );

  return (
    <aside className="w-64 h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
              AeroTask
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              {isAdmin ? 'Admin Console' : 'Workspace'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* User Workspace Section */}
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            My Workspace
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/user/dashboard" className={navItemClass} onClick={onCloseMobile}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/user/tasks" className={navItemClass} onClick={onCloseMobile}>
              <CheckSquare className="w-4 h-4" />
              <span>My Tasks</span>
            </NavLink>
            <NavLink to="/user/analytics" className={navItemClass} onClick={onCloseMobile}>
              <BarChart3 className="w-4 h-4" />
              <span>Performance</span>
            </NavLink>
            <NavLink to="/user/profile" className={navItemClass} onClick={onCloseMobile}>
              <User className="w-4 h-4" />
              <span>Profile</span>
            </NavLink>
          </nav>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Administration
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono font-medium">
                Admin
              </span>
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/admin/dashboard" className={navItemClass} onClick={onCloseMobile}>
                <Shield className="w-4 h-4 text-brand-500" />
                <span>Overview</span>
              </NavLink>
              <NavLink to="/admin/tasks" className={navItemClass} onClick={onCloseMobile}>
                <Briefcase className="w-4 h-4" />
                <span>All Tasks</span>
              </NavLink>
              <NavLink to="/admin/users" className={navItemClass} onClick={onCloseMobile}>
                <Users className="w-4 h-4" />
                <span>Team Members</span>
              </NavLink>
              <NavLink to="/admin/teams" className={navItemClass} onClick={onCloseMobile}>
                <Layers className="w-4 h-4" />
                <span>Departments</span>
              </NavLink>
              <NavLink to="/admin/analytics" className={navItemClass} onClick={onCloseMobile}>
                <BarChart3 className="w-4 h-4" />
                <span>Org Analytics</span>
              </NavLink>
              <NavLink to="/admin/workload" className={navItemClass} onClick={onCloseMobile}>
                <Activity className="w-4 h-4" />
                <span>Workload</span>
              </NavLink>
              <NavLink to="/admin/settings" className={navItemClass} onClick={onCloseMobile}>
                <Settings className="w-4 h-4" />
                <span>System Settings</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-medium text-xs flex items-center justify-center shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                {profile?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {profile?.team || profile?.systemRole || 'Member'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle size="sm" />
            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
