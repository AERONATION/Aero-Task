import React, { useState } from 'react';
import { Shield, Database, Lock, Key, Terminal, Server, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { seedFirestoreData } from '@/services/seedService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export const AdminSettings: React.FC = () => {
  const { user, profile } = useAuth();
  const { success, error } = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleSeedDatabase = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedFirestoreData(user.uid, profile?.name || user.displayName || 'Admin User');
      success('Database seeded successfully with sample models, tasks, and teams!');
    } catch (err: any) {
      console.error('Seed error:', err);
      error(err.message || 'Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          System Administration & Security
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Architecture overview, access control policies, and infrastructure configuration
        </p>
      </div>

      {/* Database Models & Sample Data Seeder */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Database className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold">Initialize Database Models & Sample Records</h3>
          </div>
          <Button
            size="sm"
            onClick={handleSeedDatabase}
            loading={seeding}
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          >
            Seed Database Models
          </Button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Instantly populate your live Cloud Firestore database with standard task models, 7 department rosters, activity logs, and real delivery timestamps to view live Recharts analytics immediately.
        </p>
      </div>

      {/* Security Architecture Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold">Zero-Trust Authorization Model</h3>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          AeroTask is designed without any external custom backend or Node/Express server. All security, authentication, and authorization policies are strictly enforced at the infrastructure level via <strong>Cloud Firestore Security Rules</strong>.
        </p>

        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Client-Side Privilege Escalation Prevented</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] pl-6">
            New user registrations are strictly validated by <code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded font-mono">firestore.rules</code> to always initialize with <code className="font-mono">systemRole = 'user'</code>. Users cannot modify their own or another user's role.
          </p>
        </div>
      </div>

      {/* Initial Admin Bootstrap Guide */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <Key className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold">Initial Administrator Provisioning</h3>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          In adherence to enterprise security best practices, there is <strong>no public registration option</strong> for administrators. To establish the initial administrator in a new deployment:
        </p>

        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono space-y-2">
            <div className="text-zinc-400 text-[11px]">// Method 1: Firebase Console (Recommended for initial setup)</div>
            <p className="text-zinc-700 dark:text-zinc-300">
              1. Register a standard user account in the AeroTask login screen (or sign in with Google).
            </p>
            <p className="text-zinc-700 dark:text-zinc-300">
              2. Open your <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">Firebase Console</a> &rarr; Firestore Database &rarr; <code className="text-amber-500">users</code> collection.
            </p>
            <p className="text-zinc-700 dark:text-zinc-300">
              3. Locate the user document by UID and change the field <code className="text-emerald-500">systemRole</code> from <code className="text-rose-400">"user"</code> to <code className="text-emerald-400">"admin"</code>.
            </p>
            <p className="text-zinc-700 dark:text-zinc-300">
              4. Refresh the AeroTask tab. The admin console will unlock immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Production Rules Deployment */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <Terminal className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold">Deploying Firestore Rules</h3>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Ensure security rules are deployed to your Firebase Cloud project using the Firebase CLI:
        </p>

        <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto">
{`# Log in to your Firebase account
firebase login

# Select or verify your project
firebase use --add

# Deploy the verified rules
firebase deploy --only firestore:rules`}
        </pre>
      </div>
    </div>
  );
};
