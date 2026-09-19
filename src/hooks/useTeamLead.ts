import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/types/user';
import { Task } from '@/types/task';
import { subscribeTeamMembers, subscribeLeadTasks } from '@/services/teamLeadService';

export function useTeamLead() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [leadTasks, setLeadTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    let resolved = 0;
    const checkDone = () => {
      resolved++;
      if (resolved >= 2) setLoading(false);
    };

    const unsubMembers = subscribeTeamMembers(
      user.uid,
      (members) => {
        setTeamMembers(members);
        checkDone();
      },
      (err) => {
        setError(err);
        checkDone();
      }
    );

    const unsubTasks = subscribeLeadTasks(
      user.uid,
      (tasks) => {
        setLeadTasks(tasks);
        checkDone();
      },
      (err) => {
        setError(err);
        checkDone();
      }
    );

    return () => {
      unsubMembers();
      unsubTasks();
    };
  }, [user?.uid]);

  const teamMembersMap = new Map<string, UserProfile>(teamMembers.map((m) => [m.uid, m]));

  return {
    teamMembers,
    teamMembersMap,
    leadTasks,
    loading,
    error,
  };
}
