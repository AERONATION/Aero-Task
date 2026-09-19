import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, meetingsCol } from '@/firebase/firestore';
import { Meeting, MeetingInput } from '@/types/meeting';

function normalizeMeeting(id: string, data: any): Meeting {
  return {
    id,
    ...data,
    participants: Array.isArray(data.participants) ? data.participants : [],
    participantNames: Array.isArray(data.participantNames) ? data.participantNames : [],
  } as Meeting;
}

/**
 * Creates a new meeting
 */
export async function createMeeting(input: MeetingInput): Promise<string> {
  const dateTimestamp =
    input.date instanceof Timestamp ? input.date : Timestamp.fromDate(new Date(input.date));

  const data = {
    title: (input.title || '').trim(),
    description: (input.description || '').trim(),
    scheduledBy: input.scheduledBy,
    scheduledByName: input.scheduledByName || '',
    department: input.department || '',
    participants: input.participants.filter(Boolean),
    participantNames: input.participantNames || [],
    date: dateTimestamp,
    startTime: input.startTime,
    endTime: input.endTime,
    recurring: input.recurring || 'none',
    location: (input.location || '').trim(),
    notes: (input.notes || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(meetingsCol, data);
  return docRef.id;
}

/**
 * Updates an existing meeting
 */
export async function updateMeeting(
  meetingId: string,
  updates: Partial<Omit<Meeting, 'id' | 'createdAt' | 'scheduledBy'>>
): Promise<void> {
  const ref = doc(db, 'meetings', meetingId);
  const clean: Record<string, any> = { updatedAt: serverTimestamp() };

  if (updates.title !== undefined) clean.title = updates.title.trim();
  if (updates.description !== undefined) clean.description = updates.description.trim();
  if (updates.department !== undefined) clean.department = updates.department;
  if (updates.participants !== undefined) clean.participants = updates.participants.filter(Boolean);
  if (updates.participantNames !== undefined) clean.participantNames = updates.participantNames;
  if (updates.date !== undefined) {
    clean.date =
      updates.date instanceof Timestamp ? updates.date : Timestamp.fromDate(new Date(updates.date));
  }
  if (updates.startTime !== undefined) clean.startTime = updates.startTime;
  if (updates.endTime !== undefined) clean.endTime = updates.endTime;
  if (updates.recurring !== undefined) clean.recurring = updates.recurring;
  if (updates.location !== undefined) clean.location = updates.location.trim();
  if (updates.notes !== undefined) clean.notes = updates.notes.trim();

  await updateDoc(ref, clean);
}

/**
 * Deletes a meeting
 */
export async function deleteMeeting(meetingId: string): Promise<void> {
  await deleteDoc(doc(db, 'meetings', meetingId));
}

/**
 * Subscribes to meetings where user is a participant
 */
export function subscribeMyMeetings(
  uid: string,
  callback: (meetings: Meeting[]) => void,
  onError?: (err: Error) => void
) {
  if (!uid) return () => {};

  const participantQuery = query(meetingsCol, where('participants', 'array-contains', uid));
  const scheduledByQuery = query(meetingsCol, where('scheduledBy', '==', uid));

  const participantMap = new Map<string, Meeting>();
  const scheduledMap = new Map<string, Meeting>();

  const emit = () => {
    const all = new Map<string, Meeting>();
    participantMap.forEach((v, k) => all.set(k, v));
    scheduledMap.forEach((v, k) => all.set(k, v));
    const sorted = Array.from(all.values()).sort((a, b) => {
      const aT = a.date?.seconds ? a.date.seconds : 0;
      const bT = b.date?.seconds ? b.date.seconds : 0;
      return aT - bT;
    });
    callback(sorted);
  };

  const unsub1 = onSnapshot(
    participantQuery,
    (snap) => {
      participantMap.clear();
      snap.docs.forEach((d) => participantMap.set(d.id, normalizeMeeting(d.id, d.data())));
      emit();
    },
    (err) => { if (onError) onError(err); }
  );

  const unsub2 = onSnapshot(
    scheduledByQuery,
    (snap) => {
      scheduledMap.clear();
      snap.docs.forEach((d) => scheduledMap.set(d.id, normalizeMeeting(d.id, d.data())));
      emit();
    },
    (err) => { if (onError) onError(err); }
  );

  return () => { unsub1(); unsub2(); };
}

/**
 * Subscribes to all meetings in a department (for team lead)
 */
export function subscribeDepartmentMeetings(
  department: string,
  callback: (meetings: Meeting[]) => void,
  onError?: (err: Error) => void
) {
  if (!department) return () => {};

  const q = query(meetingsCol, where('department', '==', department));
  return onSnapshot(
    q,
    (snap) => {
      const meetings = snap.docs
        .map((d) => normalizeMeeting(d.id, d.data()))
        .sort((a, b) => {
          const aT = a.date?.seconds ? a.date.seconds : 0;
          const bT = b.date?.seconds ? b.date.seconds : 0;
          return aT - bT;
        });
      callback(meetings);
    },
    (err) => { if (onError) onError(err); }
  );
}

/**
 * Checks for time conflicts for a participant on a given date
 */
export async function checkMeetingConflicts(
  participantUid: string,
  date: string,   // YYYY-MM-DD
  startTime: string,
  endTime: string,
  excludeMeetingId?: string
): Promise<Meeting[]> {
  const allMeetings = await getDocs(
    query(meetingsCol, where('participants', 'array-contains', participantUid))
  );

  const conflicts: Meeting[] = [];

  allMeetings.docs.forEach((d) => {
    if (excludeMeetingId && d.id === excludeMeetingId) return;
    const m = normalizeMeeting(d.id, d.data());
    const mDate = m.date?.toDate ? m.date.toDate().toISOString().slice(0, 10) : '';
    if (mDate !== date) return;

    // Check time overlap
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const [mSH, mSM] = m.startTime.split(':').map(Number);
    const [mEH, mEM] = m.endTime.split(':').map(Number);

    const start = sH * 60 + sM;
    const end = eH * 60 + eM;
    const mStart = mSH * 60 + mSM;
    const mEnd = mEH * 60 + mEM;

    if (start < mEnd && end > mStart) {
      conflicts.push(m);
    }
  });

  return conflicts;
}
