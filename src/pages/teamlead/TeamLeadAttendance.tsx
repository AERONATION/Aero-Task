import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamLead } from '@/hooks/useTeamLead';
import { useTeamAttendance } from '@/hooks/useAttendance';
import { upsertAttendance } from '@/services/attendanceService';
import { AttendanceStatus, ATTENDANCE_STATUS_LABELS } from '@/types/attendance';
import { useToast } from '@/context/ToastContext';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { ClipboardCheck, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const STATUS_COLORS: Record<AttendanceStatus | 'unmarked', string> = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  absent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  leave: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'half-day': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  unmarked: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700',
};

const STATUS_SHORT: Record<AttendanceStatus | 'unmarked', string> = {
  present: 'P',
  absent: 'A',
  leave: 'L',
  'half-day': 'H',
  unmarked: '—',
};

export const TeamLeadAttendance: React.FC = () => {
  const { user, profile } = useAuth();
  const { teamMembers, loading: teamLoading } = useTeamLead();
  const { success, error: showError } = useToast();

  const [weekOffset, setWeekOffset] = useState(0);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Compute week dates (Mon–Sun)
  const weekDates = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekOffset]);

  const dateFrom = weekDates[0];
  const dateTo = weekDates[6];
  const teamUids = useMemo(() => teamMembers.map((m) => m.uid), [teamMembers]);

  const { recordMap, loading: attLoading } = useTeamAttendance(teamUids, dateFrom, dateTo);

  const loading = teamLoading || attLoading;

  const handleMark = useCallback(
    async (employeeId: string, date: string, status: AttendanceStatus) => {
      if (!user) return;
      const key = `${employeeId}_${date}`;
      setSavingKey(key);
      try {
        const member = teamMembers.find((m) => m.uid === employeeId);
        await upsertAttendance({
          employeeId,
          employeeName: member?.name || '',
          date,
          status,
          markedBy: user.uid,
          markedByName: profile?.name || 'Team Lead',
          department: profile?.team || '',
        });
        success(`Attendance marked: ${member?.name} → ${ATTENDANCE_STATUS_LABELS[status]}`);
      } catch (err: any) {
        showError(err.message || 'Failed to mark attendance');
      } finally {
        setSavingKey(null);
      }
    },
    [user, profile, teamMembers]
  );

  const weekLabel = `${new Date(weekDates[0]).toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${new Date(weekDates[6]).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Summary: count per member
  const memberSummary = useMemo(() => {
    return teamMembers.map((m) => {
      const present = weekDates.filter((d) => recordMap.get(`${m.uid}_${d}`)?.status === 'present').length;
      const absent = weekDates.filter((d) => recordMap.get(`${m.uid}_${d}`)?.status === 'absent').length;
      const leave = weekDates.filter((d) => recordMap.get(`${m.uid}_${d}`)?.status === 'leave').length;
      const halfDay = weekDates.filter((d) => recordMap.get(`${m.uid}_${d}`)?.status === 'half-day').length;
      const marked = weekDates.filter((d) => recordMap.has(`${m.uid}_${d}`)).length;
      return { uid: m.uid, present, absent, leave, halfDay, marked };
    });
  }, [teamMembers, weekDates, recordMap]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-500" /> Team Attendance
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Mark daily attendance for your team — duplicate entries prevented automatically
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Legend:</span>
        {Object.entries(STATUS_SHORT).filter(([k]) => k !== 'unmarked').map(([status, short]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border ${STATUS_COLORS[status as AttendanceStatus]}`}>
              {short}
            </span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{ATTENDANCE_STATUS_LABELS[status as AttendanceStatus]}</span>
          </div>
        ))}
        <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border ${STATUS_COLORS.unmarked}`}>—</span>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">Unmarked</span>
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

      {/* Attendance Grid */}
      {teamMembers.length === 0 && !loading ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-xs text-zinc-400">
          No team members assigned. Ask admin to configure the reporting structure.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-zinc-700 dark:text-zinc-300 min-w-[140px]">Member</th>
                {weekDates.map((date) => {
                  const d = new Date(date);
                  const isToday = date === new Date().toISOString().slice(0, 10);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th key={date} className={`py-3 px-2 text-center min-w-[80px] ${isToday ? 'text-emerald-600 dark:text-emerald-400' : isWeekend ? 'text-zinc-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                      <div className="font-semibold">
                        {d.toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className={`text-[10px] ${isToday ? 'font-bold' : 'font-normal'}`}>
                        {d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-center font-semibold text-zinc-700 dark:text-zinc-300 min-w-[80px]">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={weekDates.length + 2} className="py-8 text-center text-zinc-400">Loading attendance data...</td>
                </tr>
              ) : (
                teamMembers.map((member) => {
                  const summary = memberSummary.find((s) => s.uid === member.uid);
                  return (
                    <tr key={member.uid} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                      {/* Member name */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar src={member.photoURL} name={member.name} size="xs" className="w-6 h-6 text-[9px]" />
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">{member.name}</p>
                            <p className="text-[9px] text-zinc-400">{member.designation || member.team || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Attendance cells */}
                      {weekDates.map((date) => {
                        const key = `${member.uid}_${date}`;
                        const record = recordMap.get(key);
                        const isSaving = savingKey === key;
                        const d = new Date(date);
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const isFuture = date > new Date().toISOString().slice(0, 10);

                        return (
                          <td key={date} className={`py-2 px-2 ${isWeekend ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : ''}`}>
                            {isWeekend ? (
                              <div className="text-center text-[9px] text-zinc-300 dark:text-zinc-600">—</div>
                            ) : isSaving ? (
                              <div className="flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              <Select
                                value={record?.status || ''}
                                onChange={(e) => handleMark(member.uid, date, e.target.value as AttendanceStatus)}
                                className={`text-[10px] py-1 px-1.5 rounded-lg border text-center font-semibold cursor-pointer ${
                                  record ? STATUS_COLORS[record.status] : STATUS_COLORS.unmarked
                                } ${isFuture ? 'opacity-40 cursor-not-allowed' : ''}`}
                                disabled={isFuture}
                              >
                                <option value="">Mark</option>
                                <option value="present">Present (P)</option>
                                <option value="absent">Absent (A)</option>
                                <option value="leave">Leave (L)</option>
                                <option value="half-day">Half Day (H)</option>
                              </Select>
                            )}
                          </td>
                        );
                      })}

                      {/* Summary */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{summary?.present}P</span>
                          <span className="text-[10px] text-rose-500">{summary?.absent}A</span>
                          <span className="text-[10px] text-amber-500">{summary?.leave}L</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
