import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Terminal } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isConfigured } = useAuth();

  // Determine title based on current pathname
  const getPageTitle = (path: string) => {
    if (path.includes('/user/dashboard')) return 'Dashboard';
    if (path.includes('/user/tasks/')) return 'Task Details';
    if (path.includes('/user/tasks')) return 'My Tasks';
    if (path.includes('/user/analytics')) return 'Performance Analytics';
    if (path.includes('/user/profile')) return 'Account Profile';
    if (path.includes('/admin/dashboard')) return 'Admin Overview';
    if (path.includes('/admin/users/')) return 'User Details';
    if (path.includes('/admin/users')) return 'Team Management';
    if (path.includes('/admin/tasks')) return 'All Tasks Directory';
    if (path.includes('/admin/teams')) return 'Department Performance';
    if (path.includes('/admin/analytics')) return 'Organization Analytics';
    if (path.includes('/admin/settings')) return 'System Settings';
    return 'AeroTask';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#09090b] text-[#0f172a] dark:text-[#f4f4f5]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-64 h-full bg-white dark:bg-zinc-900 shadow-2xl">
            <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar
          title={getPageTitle(location.pathname)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Firebase Config Notice Banner if using placeholders */}
        {!isConfigured && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Firebase Notice:</strong> To connect your real database, copy your credentials from the Firebase Console into your local <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">.env</code> file.
              </span>
            </div>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline hover:text-amber-900 dark:hover:text-white shrink-0 ml-2"
            >
              Console &rarr;
            </a>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
