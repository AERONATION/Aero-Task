import React, { useState, useMemo } from 'react';
import { useMyAttendance } from '@/hooks/useAttendance';
import { AttendanceStatus, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '@/types/attendance';
import { ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_BG: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  absent: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  leave: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'half-day': 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

export const MyAttendance: React.FC = () => {
  const { records, attendanceMap, loading } = useMyAttendance();
  const [monthOffset, setMonthOffset] = useState(0);

  const monthDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = monthDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  // Generate all days of the month
  const calendarDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (string | null)[] = Array.from({ length: firstDay }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  }, [monthDate]);

  // Summary counts
  const summary = useMemo(() => {
    const monthStr = monthDate.toISOString().slice(0, 7);
    const monthRecords = records.filter((r) => r.date.startsWith(monthStr));
    return {
      present: monthRecords.filter((r) => r.status === 'present').length,
      absent: monthRecords.filter((r) => r.status === 'absent').length,
      leave: monthRecords.filter((r) => r.status === 'leave').length,
      halfDay: monthRecords.filter((r) => r.status === 'half-day').length,
      total: monthRecords.length,
    };
  }, [records, monthDate]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-emerald-500" /> My Attendance
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Your attendance history — marked by your team lead (read-only)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present', count: summary.present, bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' },
          { label: 'Absent', count: summary.absent, bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' },
          { label: 'On Leave', count: summary.leave, bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
          { label: 'Half Day', count: summary.halfDay, bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Month Calendar */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">{monthLabel}</span>
          <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors" disabled={monthOffset >= 0}>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2 text-center text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading attendance...</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-zinc-100 dark:bg-zinc-800">
            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="bg-zinc-50/50 dark:bg-zinc-900/50 min-h-[60px]" />;
              }
              const record = attendanceMap.get(dateStr);
              const isToday = dateStr === today;
              const d = new Date(dateStr + 'T00:00:00');
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;

              return (
                <div
                  key={dateStr}
                  className={`bg-white dark:bg-zinc-900 p-1.5 min-h-[60px] flex flex-col ${
                    isToday ? 'ring-2 ring-inset ring-brand-400' : ''
                  } ${isWeekend ? 'bg-zinc-50/80 dark:bg-zinc-900/40' : ''}`}
                >
                  <span className={`text-xs font-semibold mb-1 ${isToday ? 'text-brand-600 dark:text-brand-400' : isWeekend ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {d.getDate()}
                  </span>
                  {record && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded border text-center ${STATUS_BG[record.status]}`}>
                      {ATTENDANCE_STATUS_LABELS[record.status]}
                    </span>
                  )}
                  {!record && !isWeekend && dateStr <= today && (
                    <span className="text-[9px] text-zinc-300 dark:text-zinc-600 text-center">—</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent List */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Records</h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {records.slice(0, 15).map((record) => (
            <div key={record.id} className="px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">{record.date}</p>
                <p className="text-[10px] text-zinc-400">Marked by {record.markedByName || 'Team Lead'}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_BG[record.status]}`}>
                {ATTENDANCE_STATUS_LABELS[record.status]}
              </span>
            </div>
          ))}
          {records.length === 0 && !loading && (
            <div className="py-8 text-center text-xs text-zinc-400">No attendance records yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
