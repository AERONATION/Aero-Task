import React, { useState, useMemo } from 'react';
import { useMeetings } from '@/hooks/useMeetings';
import { Meeting } from '@/types/meeting';
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MyMeetings: React.FC = () => {
  const { meetings, upcomingMeetings, loading } = useMeetings();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    meetings.forEach((m) => {
      const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [meetings]);

  const weekLabel = `${weekDates[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-500" /> My Meetings
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Meetings you are scheduled to attend — view only
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Meetings', count: meetings.length, color: 'text-violet-600 dark:text-violet-400' },
          { label: 'Upcoming', count: upcomingMeetings.length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Today', count: meetingsByDate.get(today)?.length || 0, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{weekLabel}</span>
        <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekly Calendar View */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
          {weekDates.map((date) => {
            const isToday = date.toISOString().slice(0, 10) === today;
            return (
              <div key={date.toISOString()} className={`py-2 text-center border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 ${isToday ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400'}`}>
                  {DAYS[date.getDay()]}
                </p>
                <p className={`text-lg font-bold leading-tight ${isToday ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-900 dark:text-white'}`}>
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[200px]">
          {weekDates.map((date) => {
            const key = date.toISOString().slice(0, 10);
            const dayMeetings = meetingsByDate.get(key) || [];
            const isToday = key === today;
            return (
              <div key={key} className={`p-2 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 space-y-1.5 ${isToday ? 'bg-violet-50/40 dark:bg-violet-950/10' : ''}`}>
                {loading ? (
                  <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                ) : dayMeetings.length === 0 ? (
                  <div className="text-center text-[9px] text-zinc-300 dark:text-zinc-600 pt-4">—</div>
                ) : (
                  dayMeetings.map((m) => (
                    <div key={m.id} className="rounded-lg bg-violet-100 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 p-1.5">
                      <p className="text-[10px] font-semibold text-violet-800 dark:text-violet-200 truncate">{m.title}</p>
                      <p className="text-[9px] text-violet-600 dark:text-violet-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {formatTime(m.startTime)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All Meetings List */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">All My Meetings</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-xs text-zinc-400">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400">
            No meetings scheduled for you yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {meetings.map((m) => {
              const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
              const isPast = d < new Date(new Date().toDateString());
              return (
                <div key={m.id} className={`px-4 py-3 flex items-center gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors ${isPast ? 'opacity-60' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex flex-col items-center justify-center text-violet-700 dark:text-violet-300 shrink-0">
                    <span className="text-[9px] font-bold uppercase">{d.toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-base font-bold leading-none">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{m.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(m.startTime)} – {formatTime(m.endTime)}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {m.participants.length} participants
                      </span>
                      {m.location && (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {m.location}
                        </span>
                      )}
                      {m.recurring !== 'none' && (
                        <span className="text-[10px] text-violet-600 flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" /> {m.recurring}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Scheduled by {m.scheduledByName || 'Team Lead'}</p>
                  </div>
                  {isPast && (
                    <span className="text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">Past</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
