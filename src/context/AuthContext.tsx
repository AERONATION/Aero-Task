import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, logOut } from '@/firebase/auth';
import { getUserProfile, touchUserLastLogin, createUserProfile } from '@/services/userService';
import { UserProfile } from '@/types/user';
import { isFirebaseConfigured } from '@/firebase/config';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeamLead: boolean;
  needsOnboarding: boolean;
  isConfigured: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isFirebaseConfigured();

  const fetchProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      let userProf = await getUserProfile(firebaseUser.uid);

      // If document doesn't exist yet (e.g. initial Google login or direct creation), auto-initialize
      if (!userProf) {
        const provider = firebaseUser.providerData?.[0]?.providerId;
        const loginProvider = provider === 'google.com' ? 'google' : 'email';

        userProf = await createUserProfile(firebaseUser.uid, {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          loginProvider,
        });
      } else if (firebaseUser.photoURL && userProf.photoURL !== firebaseUser.photoURL) {
        // Sync Google photo if it changed (runs silently in background)
        import('@/services/userService').then(({ updateUserProfile }) => {
          updateUserProfile(firebaseUser.uid, { photoURL: firebaseUser.photoURL || '' }).catch(() => {});
        });
        // Optimistically update local state immediately
        userProf = { ...userProf, photoURL: firebaseUser.photoURL };
      }

      setProfile(userProf);
      touchUserLastLogin(firebaseUser.uid);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, []);


  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured, fetchProfile]);

  const handleLogout = async () => {
    try {
      await logOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isAdmin = profile?.systemRole === 'admin';
  const isTeamLead = !!(profile?.isTeamLead === true || profile?.systemRole === 'team_lead');
  const needsOnboarding = !!profile && !profile.team;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isTeamLead,
        needsOnboarding,
        isConfigured,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
