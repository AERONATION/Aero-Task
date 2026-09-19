import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface TeamLeadRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for Team Lead pages.
 *
 * Access rules:
 *  - systemRole === 'team_lead'  → ✅ (dedicated team lead, NOT admin)
 *  - isTeamLead === true          → ✅ (any user/admin with lead flag)
 *  - systemRole === 'admin' only  → ❌ (admin without lead flag cannot access)
 *
 * This means a plain user promoted to team lead (isTeamLead:true, systemRole:'user')
 * gets full team lead access WITHOUT needing admin privileges.
 * An admin also promoted to team lead (isTeamLead:true, systemRole:'admin') gets BOTH sections.
 */
export const TeamLeadRoute: React.FC<TeamLeadRouteProps> = ({ children }) => {
  const { isAuthenticated, isTeamLead, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#09090b] text-zinc-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        <span className="text-xs font-medium">Verifying team lead credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only users with isTeamLead flag (covers team_lead role AND admin+isTeamLead)
  if (!isTeamLead) {
    return <Navigate to="/user/dashboard" replace />;
  }

  return <>{children}</>;
};

