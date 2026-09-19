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
import { updateUserRole, toggleUserActiveStatus, deleteUserProfileDoc, promoteToTeamLead, demoteFromTeamLead, updateUserReportsTo } from '@/services/userService';
import { Avatar } from '@/components/ui/Avatar';
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
  Trash2,
  Ban,
  Crown,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { users, loading: usersLoading } = useUsers();
  const { allTasks, loading: tasksLoading } = useAdminTasks();
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [assignUserTarget, setAssignUserTarget] = useState<UserProfile | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<UserProfile | null>(null);
  const [userToBlock, setUserToBlock] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [leadActionUid, setLeadActionUid] = useState<string | null>(null);
  const { success, error } = useToast();

  // Team leads list for reportsTo dropdown
  const teamLeads = useMemo(
    () => users.filter((u) => u.isTeamLead || u.systemRole === 'team_lead'),
    [users]
  );

  const loading = usersLoading || tasksLoading;

  // Compute metrics per user
  const userMetricsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculatePerformanceMetrics>>();
    users.forEach((user) => {
      const userTasks = allTasks.filter((t) =>
        Array.isArray(t.assignedTo)
          ? t.assignedTo.includes(user.uid)
          : t.assignedTo === user.uid
      );
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

      if (selectedStatus === 'active') {
        if (u.isActive === false) return false;
      } else if (selectedStatus === 'blocked') {
        if (u.isActive !== false) return false;
      }

      return true;
    });
  }, [users, search, selectedTeam, selectedStatus]);

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

  const handleBlockToggleConfirm = async () => {
    if (!userToBlock) return;
    setActionLoading(true);
    const isCurrentlyActive = userToBlock.isActive !== false;
    const nextStatus = !isCurrentlyActive;
    try {
      await toggleUserActiveStatus(userToBlock.uid, nextStatus);
      success(`${userToBlock.name} is now ${nextStatus ? 'active' : 'blocked/deactivated'}`);
      setUserToBlock(null);
    } catch (err: any) {
      error(err.message || 'Failed to change account status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await deleteUserProfileDoc(userToDelete.uid);
      success(`User ${userToDelete.name} was successfully removed.`);
      setUserToDelete(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTeamLead = async (member: UserProfile) => {
    setLeadActionUid(member.uid);
    try {
      if (member.isTeamLead) {
        await demoteFromTeamLead(member.uid);
        success(`${member.name} is no longer a Team Lead`);
      } else {
        await promoteToTeamLead(member.uid);
        success(`${member.name} is now a Team Lead`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update team lead status');
    } finally {
      setLeadActionUid(null);
    }
  };

  const handleReportsTo = async (employeeUid: string, managerUid: string) => {
    try {
      await updateUserReportsTo(employeeUid, managerUid || null);
      success('Reporting structure updated');
    } catch (err: any) {
      error(err.message || 'Failed to update reporting structure');
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
            View all employees, inspect completion rates, manage roles, block/unblock, and remove users
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

        <div className="w-full sm:w-48">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked / Deactivated</option>
          </Select>
        </div>

        <div className="w-full sm:w-56">
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
              <th className="py-3 px-3 min-w-[100px]">Status</th>
              <th className="py-3 px-4 min-w-[140px]">Department</th>
              <th className="py-3 px-4 min-w-[140px]">Designation</th>
              <th className="py-3 px-4 text-center min-w-[70px]">Tasks</th>
              <th className="py-3 px-4 text-center min-w-[80px]">Done</th>
              <th className="py-3 px-4 text-center min-w-[80px]">Pending</th>
              <th className="py-3 px-4 text-center min-w-[80px]">Overdue</th>
              <th className="py-3 px-4 text-center min-w-[90px]">Rate</th>
              <th className="py-3 px-4 min-w-[110px]">Last Active</th>
              <th className="py-3 px-4 text-right min-w-[160px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={11} />
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-10 text-center text-xs text-zinc-400">
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

                const isBlocked = member.isActive === false;

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
                        <Avatar src={member.photoURL} name={member.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-zinc-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            {member.systemRole === 'admin' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono font-medium">
                                Admin
                              </span>
                            )}
                            {member.isTeamLead && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-mono font-medium flex items-center gap-0.5">
                                <Crown className="w-2 h-2" /> Lead
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400 truncate block">
                            {member.email}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
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
                    <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-[140px]">
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
                        {/* Make / Revoke Team Lead */}
                        <button
                          onClick={() => handleToggleTeamLead(member)}
                          disabled={leadActionUid === member.uid}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            member.isTeamLead
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-200'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200'
                          } disabled:opacity-50`}
                          title={member.isTeamLead ? 'Revoke Team Lead' : 'Make Team Lead'}
                        >
                          {member.isTeamLead ? '★ Lead' : '+ Lead'}
                        </button>

                        {/* Assign Task */}
                        <button
                          onClick={() => setAssignUserTarget(member)}
                          className="px-2 py-1 rounded text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                          title="Assign Task to User"
                        >
                          + Task
                        </button>

                        {/* Block / Unblock Toggle */}
                        <button
                          onClick={() => setUserToBlock(member)}
                          className={`p-1.5 rounded transition-colors ${
                            isBlocked
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                          title={isBlocked ? 'Unblock User' : 'Block / Deactivate User'}
                        >
                          {isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => setUserToDelete(member)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove / Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Block/Unblock Confirmation Dialog */}
      {userToBlock && (
        <ConfirmDialog
          isOpen={!!userToBlock}
          onClose={() => setUserToBlock(null)}
          onConfirm={handleBlockToggleConfirm}
          title={userToBlock.isActive === false ? 'Unblock User' : 'Block / Deactivate User'}
          message={
            userToBlock.isActive === false
              ? `Are you sure you want to unblock ${userToBlock.name}? They will regain access to their workspace.`
              : `Are you sure you want to block ${userToBlock.name}? Their account will be immediately deactivated and denied workspace access.`
          }
          confirmText={userToBlock.isActive === false ? 'Unblock' : 'Block User'}
          variant={userToBlock.isActive === false ? 'primary' : 'danger'}
          loading={actionLoading}
        />
      )}

      {/* Delete User Confirmation Dialog */}
      {userToDelete && (
        <ConfirmDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleDeleteUserConfirm}
          title="Remove User"
          message={`Are you sure you want to permanently remove "${userToDelete.name}" (${userToDelete.email})? This action removes their profile from Firestore and cannot be undone.`}
          confirmText="Delete User"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </div>
  );
};
