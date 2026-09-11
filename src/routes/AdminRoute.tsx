import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#09090b] text-zinc-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        <span className="text-xs font-medium">Verifying administrative credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Non-admin attempting to access admin route
    return <Navigate to="/user/dashboard" replace />;
  }

  return <>{children}</>;
};
