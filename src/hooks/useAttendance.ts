import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AttendanceRecord } from '@/types/attendance';
import { subscribeMyAttendance, subscribeTeamAttendance } from '@/services/attendanceService';

/**
 * Hook for an employee viewing their own attendance history
 */
export function useMyAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsub = subscribeMyAttendance(
      user.uid,
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  // Build a date → status map for quick lookup
  const attendanceMap = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    records.forEach((r) => m.set(r.date, r));
    return m;
  }, [records]);

  return { records, attendanceMap, loading, error };
}

/**
 * Hook for a team lead viewing their team's attendance
 */
export function useTeamAttendance(teamUids: string[], dateFrom: string, dateTo: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teamUids.length || !dateFrom || !dateTo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeTeamAttendance(
      teamUids,
      dateFrom,
      dateTo,
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [teamUids.join(','), dateFrom, dateTo]);

  // Build employeeId+date → record map for O(1) lookup in table
  const recordMap = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    records.forEach((r) => m.set(`${r.employeeId}_${r.date}`, r));
    return m;
  }, [records]);

  return { records, recordMap, loading, error };
}
