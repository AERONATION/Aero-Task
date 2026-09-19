import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Meeting } from '@/types/meeting';
import { subscribeMyMeetings, subscribeDepartmentMeetings } from '@/services/meetingService';

export function useMeetings() {
  const { user, profile } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const unsub = subscribeMyMeetings(
      user.uid,
      (data) => {
        setMeetings(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // Upcoming meetings (today and future)
  const now = new Date();
  const upcomingMeetings = meetings.filter((m) => {
    const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
    return d >= new Date(now.toDateString());
  });

  return { meetings, upcomingMeetings, loading, error };
}

export function useDepartmentMeetings(department: string) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!department) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeDepartmentMeetings(
      department,
      (data) => {
        setMeetings(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [department]);

  return { meetings, loading, error };
}
