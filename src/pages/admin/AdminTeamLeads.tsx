import React, { useState, useMemo } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { UserProfile } from '@/types/user';
import { promoteToTeamLead, demoteFromTeamLead, updateUserReportsTo } from '@/services/userService';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import {
  Search, Users, GitBranch, AlertCircle, Crown,
  ChevronDown, ChevronRight, Shield, User, X,
} from 'lucide-react';

// ─── Helper ───────────────────────────────────────────────────────────────────

function getRoleBadges(u: UserProfile) {
  const badges = [];
  if (u.systemRole === 'admin') badges.push({ label: 'Admin', bg: 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' });
  if (u.isTeamLead || u.systemRole === 'team_lead') badges.push({ label: 'Lead', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' });
  if (badges.length === 0) badges.push({ label: 'Member', bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' });
  return badges;
}

// ─── Expanded Team Card ────────────────────────────────────────────────────────

interface TeamCardProps {
  lead: UserProfile;
  members: UserProfile[];
  allLeads: UserProfile[];
  allUsers: UserProfile[];
  onToggleLead: (u: UserProfile) => void;
  onChangeReportsTo: (employeeUid: string, managerUid: string) => void;
  leadLoading: string | null;
}

const TeamCard: React.FC<TeamCardProps> = ({
  lead, members, allLeads, allUsers, onToggleLead, onChangeReportsTo, leadLoading,
}) => {
  const [expanded, setExpanded] = useState(true);
  const badges = getRoleBadges(lead);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Lead Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/10 cursor-pointer hover:bg-amber-50/80 dark:hover:bg-amber-950/20 transition-colors border-b border-zinc-100 dark:border-zinc-800"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}

        {/* Avatar */}
        <Avatar src={lead.photoURL} name={lead.name} size="md" colorClass="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900 dark:text-white text-sm">{lead.name}</span>
            {badges.map((b) => (
              <span key={b.label} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${b.bg}`}>{b.label}</span>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 truncate">{lead.email} · {lead.designation || lead.team || '—'}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {members.length} members
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLead(lead); }}
            disabled={leadLoading === lead.uid}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-200 transition-colors disabled:opacity-50"
            title="Revoke Team Lead status"
          >
            Revoke Lead
          </button>
        </div>
      </div>

      {/* Members List */}
      {expanded && (
        <div>
          {members.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-zinc-400">
              No members assigned to this lead yet.
              <br />
              <span className="text-zinc-300 dark:text-zinc-600">Use the table below to assign employees.</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {members.map((member) => {
                const mBadges = getRoleBadges(member);
                return (
                  <div key={member.uid} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    <Avatar src={member.photoURL} name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white">{member.name}</span>
                        {mBadges.map((b) => (
                          <span key={b.label} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${b.bg}`}>{b.label}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-400">{member.designation || member.email}</p>
                    </div>
                    {/* Reassign to different lead */}
                    <Select
                      value={member.reportsTo || ''}
                      onChange={(e) => onChangeReportsTo(member.uid, e.target.value)}
                      className="text-[10px] py-1 px-2 w-36"
                      title="Reassign to a different lead"
                    >
                      <option value="">— Unassign —</option>
                      {allLeads.map((l) => (
                        <option key={l.uid} value={l.uid}>
                          {l.uid === lead.uid ? `✓ ${l.name}` : l.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const AdminTeamLeads: React.FC = () => {
  const { users, loading } = useUsers();
  const { success, error: showError } = useToast();
  const [search, setSearch] = useState('');
  const [leadLoading, setLeadLoading] = useState<string | null>(null);
  const [unassignedSearch, setUnassignedSearch] = useState('');

  // All team leads
  const teamLeads = useMemo(
    () => users.filter((u) => u.isTeamLead || u.systemRole === 'team_lead'),
    [users]
  );

  // Members grouped by their lead
  const membersByLead = useMemo(() => {
    const map = new Map<string, UserProfile[]>();
    teamLeads.forEach((l) => map.set(l.uid, []));
    users.forEach((u) => {
      if (u.reportsTo && map.has(u.reportsTo)) {
        map.get(u.reportsTo)!.push(u);
      }
    });
    return map;
  }, [users, teamLeads]);

  // Users not assigned to any lead
  const unassigned = useMemo(
    () => users.filter((u) => !u.reportsTo && !u.isTeamLead && u.systemRole !== 'team_lead'),
    [users]
  );

  const filteredUnassigned = useMemo(() => {
    if (!unassignedSearch) return unassigned;
    const q = unassignedSearch.toLowerCase();
    return unassigned.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [unassigned, unassignedSearch]);

  const filteredLeads = useMemo(() => {
    if (!search) return teamLeads;
    const q = search.toLowerCase();
    return teamLeads.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [teamLeads, search]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleLead = async (member: UserProfile) => {
    setLeadLoading(member.uid);
    try {
      if (member.isTeamLead || member.systemRole === 'team_lead') {
        await demoteFromTeamLead(member.uid);
        success(`${member.name} ki Team Lead access hata di gayi`);
      } else {
        await promoteToTeamLead(member.uid);
        success(`${member.name} ab Team Lead hai`);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update');
    } finally {
      setLeadLoading(null);
    }
  };

  const handleReportsTo = async (employeeUid: string, managerUid: string) => {
    try {
      await updateUserReportsTo(employeeUid, managerUid || null);
      const emp = users.find((u) => u.uid === employeeUid);
      const mgr = users.find((u) => u.uid === managerUid);
      if (managerUid) {
        success(`${emp?.name} → ab ${mgr?.name} ke team mein hai`);
      } else {
        success(`${emp?.name} ko kisi team se unassign kar diya`);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update reporting structure');
    }
  };

  const totalAssigned = users.filter((u) => !!u.reportsTo).length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" /> Team Lead Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Promote / demote team leads · assign employees to leads · configure reporting structure
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{teamLeads.length}</p>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Team Leads
          </p>
        </div>
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 p-4">
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{totalAssigned}</p>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Assigned Members
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-4">
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{unassigned.length}</p>
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Unassigned
          </p>
        </div>
      </div>

      {/* ── SECTION 1: Team Lead Groups ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
            Team Lead Groups
          </h3>
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-xs text-zinc-400">
            Loading...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
            <Crown className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No team leads yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Use the table below to promote any member to Team Lead.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <TeamCard
                key={lead.uid}
                lead={lead}
                members={membersByLead.get(lead.uid) || []}
                allLeads={teamLeads}
                allUsers={users}
                onToggleLead={handleToggleLead}
                onChangeReportsTo={handleReportsTo}
                leadLoading={leadLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: All Employees — Assign & Promote ──────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
            All Employees — Assign to Lead / Promote
          </h3>
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search employees..."
              value={unassignedSearch}
              onChange={(e) => setUnassignedSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">Employee</th>
                <th className="py-3 px-3 min-w-[80px]">Role</th>
                <th className="py-3 px-4 min-w-[120px]">Department</th>
                <th className="py-3 px-4 min-w-[180px]">Reports To (Lead)</th>
                <th className="py-3 px-4 text-right min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)
              ) : (
                (unassignedSearch ? filteredUnassigned : users).map((member) => {
                  const badges = getRoleBadges(member);
                  const currentLead = users.find((u) => u.uid === member.reportsTo);
                  const isLead = member.isTeamLead || member.systemRole === 'team_lead';

                  return (
                    <tr key={member.uid} className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors ${isLead ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''}`}>
                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={member.photoURL}
                            name={member.name}
                            size="sm"
                            colorClass={isLead ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' : undefined}
                          />
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white text-xs">{member.name}</p>
                            <p className="text-[10px] text-zinc-400 truncate max-w-[140px]">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Badges */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          {badges.map((b) => (
                            <span key={b.label} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${b.bg}`}>{b.label}</span>
                          ))}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-300">
                        {member.designation && <p className="text-[10px] text-zinc-400">{member.designation}</p>}
                        {member.team || '—'}
                      </td>

                      {/* Reports To dropdown */}
                      <td className="py-3 px-4">
                        {isLead ? (
                          <span className="text-[10px] text-zinc-400 italic">Is a lead — not assignable</span>
                        ) : (
                          <Select
                            value={member.reportsTo || ''}
                            onChange={(e) => handleReportsTo(member.uid, e.target.value)}
                            className="text-xs py-1.5"
                          >
                            <option value="">— No Lead Assigned —</option>
                            {teamLeads.map((lead) => (
                              <option key={lead.uid} value={lead.uid}>
                                {lead.name} {lead.team ? `(${lead.team})` : ''}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Promote / Revoke Team Lead */}
                          <Button
                            variant="outline"
                            size="sm"
                            loading={leadLoading === member.uid}
                            onClick={() => handleToggleLead(member)}
                            className={isLead
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/40'
                              : 'text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/40'
                            }
                            icon={<Crown className="w-3 h-3" />}
                          >
                            {isLead ? 'Revoke Lead' : 'Make Lead'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/10 p-4 text-xs text-blue-700 dark:text-blue-300 space-y-1">
        <p className="font-semibold">How it works:</p>
        <ul className="space-y-0.5 list-disc list-inside text-blue-600 dark:text-blue-400">
          <li>Kisi bhi user (admin ya normal member) ko <strong>Team Lead</strong> banaya ja sakta hai</li>
          <li>Team lead hona aur admin hona <strong>alag alag</strong> cheezein hain — ek dono ho sakta hai</li>
          <li>"Reports To" se aap batate hain ki kaun sa employee kis lead ke under hai</li>
          <li>Ek lead apni team ke members ko hi task assign kar sakta hai</li>
          <li>Admin chahe to kisi lead ko admin bhi bana sakta hai (Admin Users page se)</li>
        </ul>
      </div>
    </div>
  );
};
