import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db, usersCol } from '@/firebase/firestore';
import { UserProfile, SystemRole, TeamType } from '@/types/user';

/**
 * Creates initial user profile document upon registration.
 * Explicitly forces systemRole = 'user'.
 */
export async function createUserProfile(
  uid: string,
  data: {
    name: string;
    email: string;
    photoURL?: string;
    loginProvider?: 'google' | 'email';
  }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const now = serverTimestamp();

  const newProfile: Record<string, any> = {
    uid,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    photoURL: data.photoURL || '',
    systemRole: 'user' as SystemRole, // Security: Strictly user, never admin on self-registration
    designation: '',
    isActive: true,
    loginProvider: data.loginProvider || 'email',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  // Use merge:true so repeat logins don't overwrite existing role/team
  await setDoc(userRef, newProfile, { merge: true });
  return {
    ...newProfile,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  } as UserProfile;
}

/**
 * Fetches user profile document by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

/**
 * Updates last login timestamp for active user
 */
export async function touchUserLastLogin(uid: string): Promise<void> {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to update last login timestamp:', err);
  }
}

/**
 * Updates user profile details (team, designation, name, photoURL)
 */
export async function updateUserProfileDoc(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'systemRole' | 'createdAt'>>
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin action: Update user's system role
 */
export async function updateUserRole(uid: string, newRole: SystemRole): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    systemRole: newRole,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin action: Update user's active status
 */
export async function toggleUserActiveStatus(uid: string, isActive: boolean): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetches all users (for admin directory / assignment dropdowns)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(usersCol, orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

/**
 * Subscribes to real-time updates of all users
 */
export function subscribeAllUsers(
  callback: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(usersCol, orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const users = snap.docs.map((d) => d.data() as UserProfile);
      callback(users);
    },
    (err) => {
      console.error('Error subscribing to users:', err);
      if (onError) onError(err);
    }
  );
}
