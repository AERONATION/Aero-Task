import React, { useMemo } from 'react';
import { useTeamLead } from '@/hooks/useTeamLead';
import { Avatar } from '@/components/ui/Avatar';
import { Activity, Flame, CheckCircle2, Loader2, Clock } from 'lucide-react';

const PRIORITY_WEIGHTS: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const TeamLeadWorkload: React.FC = () => {
  const { teamMembers, leadTasks, loading } = useTeamLead();

  const workloadData = useMemo(() => {
    return teamMembers.map((member) => {
      const memberTasks = leadTasks.filter((t) =>
        Array.isArray(t.assignedTo) ? t.assignedTo.includes(member.uid) : t.assignedTo === member.uid
      );
      const openTasks = memberTasks.filter((t) => t.status !== 'completed');
      const inProgress = memberTasks.filter((t) => t.status === 'in_progress').length;
      const done = memberTasks.filter((t) => t.status === 'completed').length;
      const overdue = openTasks.filter((t) => {
        const dl = t.deadline?.seconds ? t.deadline.seconds * 1000 : new Date(t.deadline || 0).getTime();
        return dl < Date.now();
      }).length;
      const weight = openTasks.reduce((acc, t) => acc + (PRIORITY_WEIGHTS[t.priority] || 1), 0);
      const byPriority = {
        urgent: openTasks.filter((t) => t.priority === 'urgent').length,
        high: openTasks.filter((t) => t.priority === 'high').length,
        medium: openTasks.filter((t) => t.priority === 'medium').length,
        low: openTasks.filter((t) => t.priority === 'low').length,
      };
      return { member, openTasks: openTasks.length, inProgress, done, overdue, weight, byPriority };
    }).sort((a, b) => b.weight - a.weight);
  }, [teamMembers, leadTasks]);

  const maxWeight = Math.max(...workloadData.map((d) => d.weight), 1);

  const getHeatColor = (weight: number, max: number) => {
    const ratio = weight / max;
    if (ratio === 0) return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-400', label: 'Free' };
    if (ratio < 0.3) return { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'Light' };
    if (ratio < 0.6) return { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', label: 'Moderate' };
    if (ratio < 0.85) return { bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', label: 'Heavy' };
    return { bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', label: 'Overloaded' };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-500" /> Department Workload
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Task load heatmap — see who is overloaded and who has capacity
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Load Level:</span>
        {[
          { label: 'Free', bg: 'bg-zinc-200 dark:bg-zinc-700' },
          { label: 'Light', bg: 'bg-emerald-400' },
          { label: 'Moderate', bg: 'bg-amber-400' },
          { label: 'Heavy', bg: 'bg-orange-400' },
          { label: 'Overloaded', bg: 'bg-rose-500' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${l.bg}`} />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{l.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-zinc-400">Loading workload data...</div>
      ) : workloadData.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-xs text-zinc-400">
          No team members assigned. Ask admin to configure the reporting structure.
        </div>
      ) : (
        <>
          {/* Heatmap Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workloadData.map(({ member, openTasks, inProgress, done, overdue, weight, byPriority }) => {
              const heat = getHeatColor(weight, maxWeight);
              const barWidth = Math.round((weight / maxWeight) * 100);
              return (
                <div
                  key={member.uid}
                  className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all hover:shadow-md`}
                >
                  {/* Member Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={member.photoURL} name={member.name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{member.name}</p>
                        <p className="text-[10px] text-zinc-400">{member.designation || member.team || '—'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${heat.bg} ${heat.text}`}>
                      {heat.label}
                    </span>
                  </div>

                  {/* Load Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Workload Score</span>
                      <span className="font-semibold">{weight}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          barWidth < 30 ? 'bg-emerald-400' :
                          barWidth < 60 ? 'bg-amber-400' :
                          barWidth < 85 ? 'bg-orange-400' :
                          'bg-rose-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[
                      { label: 'Open', val: openTasks, color: 'text-blue-600 dark:text-blue-400' },
                      { label: 'Active', val: inProgress, color: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Overdue', val: overdue, color: 'text-rose-600 dark:text-rose-400' },
                      { label: 'Done', val: done, color: 'text-emerald-600 dark:text-emerald-400' },
                    ].map((s) => (
                      <div key={s.label} className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg py-1.5">
                        <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] text-zinc-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Priority Breakdown */}
                  {openTasks > 0 && (
                    <div className="mt-3 flex gap-1">
                      {byPriority.urgent > 0 && (
                        <span className="flex-1 text-center text-[9px] py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold">
                          {byPriority.urgent}U
                        </span>
                      )}
                      {byPriority.high > 0 && (
                        <span className="flex-1 text-center text-[9px] py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 font-semibold">
                          {byPriority.high}H
                        </span>
                      )}
                      {byPriority.medium > 0 && (
                        <span className="flex-1 text-center text-[9px] py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold">
                          {byPriority.medium}M
                        </span>
                      )}
                      {byPriority.low > 0 && (
                        <span className="flex-1 text-center text-[9px] py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 font-semibold">
                          {byPriority.low}L
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Workload Summary Table</h3>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Member</th>
                  <th className="py-2.5 px-3 text-center">Urgent</th>
                  <th className="py-2.5 px-3 text-center">High</th>
                  <th className="py-2.5 px-3 text-center">Medium</th>
                  <th className="py-2.5 px-3 text-center">Low</th>
                  <th className="py-2.5 px-3 text-center">Total Open</th>
                  <th className="py-2.5 px-3 text-center">Overdue</th>
                  <th className="py-2.5 px-4 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {workloadData.map(({ member, byPriority, openTasks, overdue, weight }) => {
                  const heat = getHeatColor(weight, maxWeight);
                  return (
                    <tr key={member.uid} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-white">{member.name}</td>
                      <td className="py-2.5 px-3 text-center text-rose-600 font-bold">{byPriority.urgent || '—'}</td>
                      <td className="py-2.5 px-3 text-center text-orange-600 font-semibold">{byPriority.high || '—'}</td>
                      <td className="py-2.5 px-3 text-center text-blue-600">{byPriority.medium || '—'}</td>
                      <td className="py-2.5 px-3 text-center text-zinc-500">{byPriority.low || '—'}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-zinc-900 dark:text-white">{openTasks}</td>
                      <td className="py-2.5 px-3 text-center text-rose-600 font-semibold">{overdue || '—'}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${heat.bg} ${heat.text}`}>
                          {weight}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
