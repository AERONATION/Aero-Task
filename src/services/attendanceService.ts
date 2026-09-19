import {
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, attendanceCol } from '@/firebase/firestore';
import { AttendanceRecord, AttendanceInput, AttendanceStatus } from '@/types/attendance';

function normalizeRecord(id: string, data: any): AttendanceRecord {
  return { id, ...data } as AttendanceRecord;
}

/**
 * Marks attendance with same-day duplicate prevention
 */
export async function markAttendance(
  input: AttendanceInput
): Promise<{ success: boolean; recordId?: string; error?: string; existingId?: string }> {
  // Check for existing attendance for this employee on this date
  const dupCheck = query(
    attendanceCol,
    where('employeeId', '==', input.employeeId),
    where('date', '==', input.date)
  );
  const existing = await getDocs(dupCheck);

  if (!existing.empty) {
    return {
      success: false,
      error: 'Attendance already marked for this date',
      existingId: existing.docs[0].id,
    };
  }

  const data = {
    employeeId: input.employeeId,
    employeeName: input.employeeName || '',
    date: input.date,
    status: input.status,
    markedBy: input.markedBy,
    markedByName: input.markedByName || '',
    department: input.department || '',
    notes: input.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(attendanceCol, data);
  return { success: true, recordId: docRef.id };
}

/**
 * Updates an existing attendance record (same-day correction)
 */
export async function updateAttendance(
  recordId: string,
  status: AttendanceStatus,
  notes?: string
): Promise<void> {
  const ref = doc(db, 'attendance', recordId);
  await updateDoc(ref, {
    status,
    notes: notes || '',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Marks or updates attendance for a team (upsert pattern)
 */
export async function upsertAttendance(input: AttendanceInput): Promise<string> {
  const dupCheck = query(
    attendanceCol,
    where('employeeId', '==', input.employeeId),
    where('date', '==', input.date)
  );
  const existing = await getDocs(dupCheck);

  if (!existing.empty) {
    const existingId = existing.docs[0].id;
    await updateDoc(doc(db, 'attendance', existingId), {
      status: input.status,
      notes: input.notes || '',
      markedBy: input.markedBy,
      markedByName: input.markedByName || '',
      updatedAt: serverTimestamp(),
    });
    return existingId;
  }

  const result = await markAttendance(input);
  return result.recordId || '';
}

/**
 * Subscribes to attendance records for a team (by array of UIDs) in a date range
 */
export function subscribeTeamAttendance(
  teamUids: string[],
  dateFrom: string,
  dateTo: string,
  callback: (records: AttendanceRecord[]) => void,
  onError?: (err: Error) => void
) {
  if (!teamUids.length) {
    callback([]);
    return () => {};
  }

  // Firestore 'in' operator max 30 items
  const chunks = [];
  for (let i = 0; i < teamUids.length; i += 10) {
    chunks.push(teamUids.slice(i, i + 10));
  }

  const recordMaps: Map<string, AttendanceRecord>[] = chunks.map(() => new Map());
  const unsubscribers: (() => void)[] = [];

  const emit = () => {
    const all = new Map<string, AttendanceRecord>();
    recordMaps.forEach((m) => m.forEach((v, k) => all.set(k, v)));
    callback(
      Array.from(all.values()).sort((a, b) =>
        a.date > b.date ? -1 : a.date < b.date ? 1 : 0
      )
    );
  };

  chunks.forEach((chunk, i) => {
    const q = query(
      attendanceCol,
      where('employeeId', 'in', chunk),
      where('date', '>=', dateFrom),
      where('date', '<=', dateTo)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        recordMaps[i].clear();
        snap.docs.forEach((d) => recordMaps[i].set(d.id, normalizeRecord(d.id, d.data())));
        emit();
      },
      (err) => { if (onError) onError(err); }
    );
    unsubscribers.push(unsub);
  });

  return () => unsubscribers.forEach((u) => u());
}

/**
 * Subscribes to an employee's own attendance history (read-only for employee)
 */
export function subscribeMyAttendance(
  employeeId: string,
  callback: (records: AttendanceRecord[]) => void,
  onError?: (err: Error) => void
) {
  if (!employeeId) return () => {};

  // Simple query without orderBy to avoid needing a composite index
  const q = query(
    attendanceCol,
    where('employeeId', '==', employeeId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs
        .map((d) => normalizeRecord(d.id, d.data()))
        .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
        .slice(0, 90); // last 90 records client-side
      callback(records);
    },
    (err) => { if (onError) onError(err); }
  );
}

/**
 * Gets attendance summary for a team for a given month (YYYY-MM)
 */
export async function getAttendanceSummary(
  teamUids: string[],
  month: string // "YYYY-MM"
): Promise<Record<string, Record<AttendanceStatus, number>>> {
  if (!teamUids.length) return {};

  const dateFrom = `${month}-01`;
  const dateToDate = new Date(`${month}-01`);
  dateToDate.setMonth(dateToDate.getMonth() + 1);
  dateToDate.setDate(0);
  const dateTo = dateToDate.toISOString().slice(0, 10);

  const summary: Record<string, Record<AttendanceStatus, number>> = {};

  const chunks = [];
  for (let i = 0; i < teamUids.length; i += 10) {
    chunks.push(teamUids.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(
      attendanceCol,
      where('employeeId', 'in', chunk),
      where('date', '>=', dateFrom),
      where('date', '<=', dateTo)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const rec = normalizeRecord(d.id, d.data());
      if (!summary[rec.employeeId]) {
        summary[rec.employeeId] = { present: 0, absent: 0, leave: 0, 'half-day': 0 };
      }
      summary[rec.employeeId][rec.status]++;
    });
  }

  return summary;
}
