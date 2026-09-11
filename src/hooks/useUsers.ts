import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/user';
import { subscribeAllUsers } from '@/services/userService';

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllUsers(
      (items) => {
        setUsers(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const usersMap = new Map<string, UserProfile>(users.map((u) => [u.uid, u]));

  return {
    users,
    usersMap,
    loading,
    error,
  };
}
