import React, { useMemo } from 'react';
import { useTeamLead } from '@/hooks/useTeamLead';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Mail, Briefcase, Star, CheckCircle2, Clock } from 'lucide-react';

export const TeamLeadTeam: React.FC = () => {
  const { teamMembers, leadTasks, loading } = useTeamLead();

  const memberStats = useMemo(() => {
    return teamMembers.map((member) => {
      const tasks = leadTasks.filter((t) =>
        Array.isArray(t.assignedTo) ? t.assignedTo.includes(member.uid) : t.assignedTo === member.uid
      );
      const done = tasks.filter((t) => t.status === 'completed').length;
      const open = tasks.filter((t) => t.status !== 'completed').length;
      const rate = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
      return { member, done, open, total: tasks.length, rate };
    });
  }, [teamMembers, leadTasks]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" /> My Team
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} reporting to you
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse bg-zinc-50 dark:bg-zinc-900 h-40" />
          ))}
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <Users className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No team members assigned yet</p>
          <p className="text-xs text-zinc-400 mt-1">Ask an admin to set the <code>reportsTo</code> field for your team members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberStats.map(({ member, done, open, total, rate }) => (
            <div
              key={member.uid}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-all"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Avatar src={member.photoURL} name={member.name} size="lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-white truncate">{member.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{member.designation || '—'}</p>
                </div>
              </div>

              {/* Info Pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {member.team && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
                    <Briefcase className="w-2.5 h-2.5" /> {member.team}
                  </span>
                )}
                {member.employmentType && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                    {member.employmentType}
                  </span>
                )}
                {member.experienceLevel && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium">
                    <Star className="w-2.5 h-2.5" /> {member.experienceLevel}
                  </span>
                )}
              </div>

              {/* Email */}
              {member.email && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-3 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}

              {/* Task Stats */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-400 font-medium">Task Completion</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{rate}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${rate >= 80 ? 'bg-emerald-400' : rate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> {done} done
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3" /> {open} open
                  </span>
                  <span className="text-zinc-400 ml-auto">{total} total</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
