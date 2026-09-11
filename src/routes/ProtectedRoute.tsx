import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, needsOnboarding, profile, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#09090b] text-zinc-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        <span className="text-xs font-medium">Authenticating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account Blocked / Deactivated Check
  if (profile && profile.isActive === false && profile.systemRole !== 'admin') {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#09090b] p-4 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <UserX className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Account Deactivated</h2>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your account has been deactivated or blocked by an Administrator. Please reach out to your team lead or system admin to restore access.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout()} className="w-full">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // If user profile is missing team selection, redirect to onboarding unless already there
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
