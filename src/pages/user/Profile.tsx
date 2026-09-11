import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfileDoc } from '@/services/userService';
import { updateFirebaseProfile } from '@/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TEAMS, TeamType } from '@/types/user';
import { formatDate } from '@/utils/date';
import { useToast } from '@/context/ToastContext';
import { User, Mail, Shield, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [designation, setDesignation] = useState(profile?.designation || '');
  const [team, setTeam] = useState<TeamType | ''>(profile?.team || '');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      error('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateFirebaseProfile(user, { displayName: name.trim() });

      // Update Firestore user document
      await updateUserProfileDoc(user.uid, {
        name: name.trim(),
        designation: designation.trim(),
        team: team ? (team as TeamType) : undefined,
      });

      await refreshProfile();
      success('Profile updated successfully');
    } catch (err: any) {
      console.error('Profile update error:', err);
      error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      {/* Page Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Account Profile
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Manage your internal credentials, department assignment, and work designation
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm shrink-0">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
                {profile?.name || user?.displayName || 'Teammate'}
              </h3>
              <span
                className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded ${
                  profile?.systemRole === 'admin'
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {profile?.systemRole === 'admin' ? 'Administrator' : 'Team Member'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                {profile?.team || 'Unassigned Department'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Joined {formatDate(profile?.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          Personal Information
        </h4>

        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            value={user?.email || ''}
            disabled
            leftIcon={<Mail className="w-4 h-4" />}
            helperText="Email is bound to your Firebase Authentication account and cannot be modified directly."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department / Team"
              value={team}
              onChange={(e) => setTeam(e.target.value as TeamType)}
            >
              <option value="">Select department...</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Input
              label="Role / Designation"
              placeholder="e.g. Senior Frontend Engineer"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <Button type="submit" size="sm" loading={loading} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
