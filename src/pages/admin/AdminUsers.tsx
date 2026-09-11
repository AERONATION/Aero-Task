import React, { useState, useMemo } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useAdminTasks } from '@/hooks/useAdminTasks';
import { UserProfile, TEAMS } from '@/types/user';
import { calculatePerformanceMetrics } from '@/services/analyticsService';
import { formatDate, formatRelativeDate } from '@/utils/date';
import { TaskModal } from '@/components/tasks/TaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { updateUserRole, toggleUserActiveStatus } from '@/services/userService';
import { useToast } from '@/context/ToastContext';
import { Link } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { users, loading: usersLoading } = useUsers();
  const { allTasks, loading: tasksLoading } = useAdminTasks();
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [assignUserTarget, setAssignUserTarget] = useState<UserProfile | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { success, error } = useToast();

  const loading = usersLoading || tasksLoading;

  // Compute metrics per user
  const userMetricsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculatePerformanceMetrics>>();
    users.forEach((user) => {
      const userTasks = allTasks.filter((t) => t.assignedTo === user.uid);
      map.set(user.uid, calculatePerformanceMetrics(userTasks));
    });
    return map;
  }, [users, allTasks]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const query = search.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        const matchesTeam = u.team?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesTeam) return false;
      }

      if (selectedTeam !== 'all') {
        if (u.team !== selectedTeam) return false;
      }

      return true;
    });
  }, [users, search, selectedTeam]);

  const handleRoleToggle = async () => {
    if (!roleChangeUser) return;
    setActionLoading(true);
    const newRole = roleChangeUser.systemRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(roleChangeUser.uid, newRole);
      success(`Updated role for ${roleChangeUser.name} to ${newRole}`);
      setRoleChangeUser(null);
    } catch (err: any) {
      error(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (targetUser: UserProfile) => {
    const nextStatus = targetUser.isActive === false ? true : false;
    try {
      await toggleUserActiveStatus(targetUser.uid, nextStatus);
      success(`${targetUser.name} is now ${nextStatus ? 'active' : 'inactive'}`);
    } catch (err: any) {
      error(err.message || 'Failed to change status');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Team Members Directory
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            View all employees, inspect completion rates, manage roles, and assign tasks
          </p>
        </div>

        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 self-start sm:self-auto">
          Total Employees: <strong>{users.length}</strong>
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search team members by name, email, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-60">
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="all">All Departments</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-4 min-w-[200px]">Member</th>
              <th className="py-3 px-4 min-w-[150px]">Department</th>
              <th className="py-3 px-4 min-w-[140px]">Designation</th>
              <th className="py-3 px-4 text-center min-w-[70px]">Tasks</th>
              <th className="py-3 px-4 text-center min-w-[80px]">Done</th>
              <th className="py-3 px-4 text-center min-w-[80px]">Pending</th>
              <th className="py-3 px-4 text-center min-w-[80px]">Overdue</th>
              <th className="py-3 px-4 text-center min-w-[100px]">Rate</th>
              <th className="py-3 px-4 min-w-[120px]">Last Active</th>
              <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={10} />
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-xs text-zinc-400">
                  No team members matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((member) => {
                const metrics = userMetricsMap.get(member.uid) || {
                  totalTasks: 0,
                  completedTasks: 0,
                  pendingTasks: 0,
                  overdueTasks: 0,
                  completionRate: 0,
                };

                return (
                  <tr
                    key={member.uid}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Name + Email + Role */}
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/admin/users/${member.uid}`}
                        className="flex items-center gap-2.5 hover:text-brand-600 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold text-xs flex items-center justify-center shrink-0">
                          {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            {member.systemRole === 'admin' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono font-medium">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400 truncate block">
                            {member.email}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {member.team ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {member.team}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-[150px]">
                      {member.designation || '—'}
                    </td>

                    {/* Total Tasks */}
                    <td className="py-3.5 px-4 text-center font-semibold text-zinc-900 dark:text-white text-xs">
                      {metrics.totalTasks}
                    </td>

                    {/* Completed */}
                    <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                      {metrics.completedTasks}
                    </td>

                    {/* Pending */}
                    <td className="py-3.5 px-4 text-center text-zinc-600 dark:text-zinc-400 text-xs">
                      {metrics.pendingTasks}
                    </td>

                    {/* Overdue */}
                    <td className="py-3.5 px-4 text-center text-rose-600 dark:text-rose-400 font-medium text-xs">
                      {metrics.overdueTasks > 0 ? metrics.overdueTasks : '0'}
                    </td>

                    {/* Completion Rate */}
                    <td className="py-3.5 px-4 text-center text-xs">
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {metrics.completionRate}%
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-zinc-400">
                      {formatRelativeDate(member.lastLoginAt || member.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Assign Task */}
                        <button
                          onClick={() => setAssignUserTarget(member)}
                          className="px-2 py-1 rounded text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                          title="Assign Task to User"
                        >
                          + Task
                        </button>

                        {/* Drill Down */}
                        <Link
                          to={`/admin/users/${member.uid}`}
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Task Assignment Modal pre-selecting this user */}
      {assignUserTarget && (
        <TaskModal
          isOpen={!!assignUserTarget}
          onClose={() => setAssignUserTarget(null)}
          users={users}
        />
      )}

      {/* Role Change Confirmation Dialog */}
      {roleChangeUser && (
        <ConfirmDialog
          isOpen={!!roleChangeUser}
          onClose={() => setRoleChangeUser(null)}
          onConfirm={handleRoleToggle}
          title="Change System Role"
          message={`Are you sure you want to change ${roleChangeUser.name}'s role to ${
            roleChangeUser.systemRole === 'admin' ? 'Team Member' : 'Administrator'
          }?`}
          confirmText="Change Role"
          variant="primary"
          loading={actionLoading}
        />
      )}
    </div>
  );
};
