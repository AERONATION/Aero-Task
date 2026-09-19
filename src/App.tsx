import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminRoute } from '@/routes/AdminRoute';
import { TeamLeadRoute } from '@/routes/TeamLeadRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Auth pages
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { Onboarding } from '@/pages/auth/Onboarding';

// User pages
import { Dashboard } from '@/pages/user/Dashboard';
import { MyTasks } from '@/pages/user/MyTasks';
import { TaskDetail } from '@/pages/user/TaskDetail';
import { Profile } from '@/pages/user/Profile';
import { Analytics } from '@/pages/user/Analytics';
import { MyAttendance } from '@/pages/user/MyAttendance';
import { MyMeetings } from '@/pages/user/MyMeetings';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminUserDetail } from '@/pages/admin/AdminUserDetail';
import { AdminTasks } from '@/pages/admin/AdminTasks';
import { AdminTeams } from '@/pages/admin/AdminTeams';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminWorkload } from '@/pages/admin/AdminWorkload';
import { AdminTeamLeads } from '@/pages/admin/AdminTeamLeads';

// Team Lead pages
import { TeamLeadDashboard } from '@/pages/teamlead/TeamLeadDashboard';
import { TeamLeadTasks } from '@/pages/teamlead/TeamLeadTasks';
import { TeamLeadTeam } from '@/pages/teamlead/TeamLeadTeam';
import { TeamLeadWorkload } from '@/pages/teamlead/TeamLeadWorkload';
import { TeamLeadMeetings } from '@/pages/teamlead/TeamLeadMeetings';
import { TeamLeadAttendance } from '@/pages/teamlead/TeamLeadAttendance';
import { TeamLeadHierarchy } from '@/pages/teamlead/TeamLeadHierarchy';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/user/dashboard" replace /> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Mandatory Onboarding Route (requires auth) */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* User Protected Routes */}
              <Route
                path="/user"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/user/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tasks" element={<MyTasks />} />
                <Route path="tasks/:taskId" element={<TaskDetail />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profile" element={<Profile />} />
                <Route path="attendance" element={<MyAttendance />} />
                <Route path="meetings" element={<MyMeetings />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AppLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:uid" element={<AdminUserDetail />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="teams" element={<AdminTeams />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="workload" element={<AdminWorkload />} />
                <Route path="teamleads" element={<AdminTeamLeads />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Team Lead Protected Routes */}
              <Route
                path="/teamlead"
                element={
                  <TeamLeadRoute>
                    <AppLayout />
                  </TeamLeadRoute>
                }
              >
                <Route index element={<Navigate to="/teamlead/dashboard" replace />} />
                <Route path="dashboard" element={<TeamLeadDashboard />} />
                <Route path="tasks" element={<TeamLeadTasks />} />
                <Route path="team" element={<TeamLeadTeam />} />
                <Route path="workload" element={<TeamLeadWorkload />} />
                <Route path="meetings" element={<TeamLeadMeetings />} />
                <Route path="attendance" element={<TeamLeadAttendance />} />
                <Route path="hierarchy" element={<TeamLeadHierarchy />} />
              </Route>

              {/* Root & Catch-All */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
