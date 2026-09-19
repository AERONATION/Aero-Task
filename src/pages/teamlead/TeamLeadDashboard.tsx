import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTeamLead } from '@/hooks/useTeamLead';
import { useMeetings } from '@/hooks/useMeetings';
import { useMyAttendance } from '@/hooks/useAttendance';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import {
  Users, CheckSquare, Calendar, ClipboardCheck,
  TrendingUp, AlertCircle, Clock, CheckCircle2,
  ArrowRight, Briefcase, Activity,
} from 'lucide-react';
import { formatDate } from '@/utils/date';

export const TeamLeadDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { teamMembers, leadTasks, loading } = useTeamLead();
  const { upcomingMeetings } = useMeetings();
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const open = leadTasks.filter((t) => t.status !== 'completed').length;
    const done = leadTasks.filter((t) => t.status === 'completed').length;
    const urgent = leadTasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
    const overdue = leadTasks.filter((t) => {
      if (t.status === 'completed') return false;
      const dl = t.deadline?.seconds ? t.deadline.seconds * 1000 : new Date(t.deadline || 0).getTime();
      return dl < Date.now();
    }).length;
    return { open, done, urgent, overdue };
  }, [leadTasks]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayMeetings = upcomingMeetings.filter((m) => {
    const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
    return d.toISOString().slice(0, 10) === today;
  });

  const statCards = [
    {
      label: 'Team Members',
      value: teamMembers.length,
      icon: <Users className="w-5 h-5" />,
      color: 'indigo',
      href: '/teamlead/team',
    },
    {
      label: 'Open Tasks',
      value: stats.open,
      icon: <CheckSquare className="w-5 h-5" />,
      color: 'blue',
      href: '/teamlead/tasks',
    },
    {
      label: 'Urgent',
      value: stats.urgent,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'rose',
      href: '/teamlead/tasks',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: <Clock className="w-5 h-5" />,
      color: 'amber',
      href: '/teamlead/tasks',
    },
    {
      label: 'Completed',
      value: stats.done,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'emerald',
      href: '/teamlead/tasks',
    },
    {
      label: "Today's Meetings",
      value: todayMeetings.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'violet',
      href: '/teamlead/meetings',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', iconBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', iconBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', iconBg: 'bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-400' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {getGreeting()}, {profile?.name?.split(' ')[0]}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Team Lead Dashboard · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const c = colorMap[card.color];
            return (
              <Link
                key={card.label}
                to={card.href}
                className={`rounded-xl border ${c.border} ${c.bg} p-4 flex flex-col gap-3 hover:shadow-md transition-all group`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{card.value}</p>
                  <p className={`text-xs font-medium ${c.text}`}>{card.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members Quick View */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">My Team</span>
            </div>
            <Link to="/teamlead/team" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <div className="p-4 text-xs text-zinc-400">Loading...</div>
            ) : teamMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No team members assigned yet. Ask admin to set <code>reportsTo</code> for your team.
              </div>
            ) : (
              teamMembers.slice(0, 6).map((member) => {
                const memberTasks = leadTasks.filter((t) =>
                  Array.isArray(t.assignedTo) ? t.assignedTo.includes(member.uid) : t.assignedTo === member.uid
                );
                const openCount = memberTasks.filter((t) => t.status !== 'completed').length;
                return (
                  <div key={member.uid} className="px-4 py-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {member.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-white">{member.name}</p>
                        <p className="text-[10px] text-zinc-400">{member.designation || member.team || '—'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      openCount > 3 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' :
                      openCount > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    }`}>
                      {openCount} open
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">Upcoming Meetings</span>
            </div>
            <Link to="/teamlead/meetings" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {upcomingMeetings.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">No upcoming meetings scheduled.</div>
            ) : (
              upcomingMeetings.slice(0, 5).map((meeting) => {
                const d = meeting.date?.toDate ? meeting.date.toDate() : new Date(meeting.date);
                const isToday = d.toISOString().slice(0, 10) === today;
                return (
                  <div key={meeting.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 text-[10px] font-bold ${
                      isToday ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' :
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}>
                      <span>{d.toLocaleDateString('en', { month: 'short' }).toUpperCase()}</span>
                      <span className="text-sm leading-none">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{meeting.title}</p>
                      <p className="text-[10px] text-zinc-400">{meeting.startTime} – {meeting.endTime} · {meeting.participants.length} participants</p>
                    </div>
                    {isToday && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 font-semibold shrink-0">TODAY</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Assign Task', href: '/teamlead/tasks', icon: <CheckSquare className="w-4 h-4" />, color: 'bg-blue-600' },
          { label: 'Mark Attendance', href: '/teamlead/attendance', icon: <ClipboardCheck className="w-4 h-4" />, color: 'bg-emerald-600' },
          { label: 'Schedule Meeting', href: '/teamlead/meetings', icon: <Calendar className="w-4 h-4" />, color: 'bg-violet-600' },
          { label: 'Workload View', href: '/teamlead/workload', icon: <Activity className="w-4 h-4" />, color: 'bg-amber-600' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`${action.color} text-white rounded-xl p-3 flex items-center gap-2.5 hover:opacity-90 transition-opacity shadow-sm`}
          >
            {action.icon}
            <span className="text-xs font-semibold">{action.label}</span>
            <ArrowRight className="w-3 h-3 ml-auto opacity-70" />
          </Link>
        ))}
      </div>
    </div>
  );
};
