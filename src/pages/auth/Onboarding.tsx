import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfileDoc } from '@/services/userService';
import { TEAMS, TeamType } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import {
  Layers,
  Server,
  Layout,
  Share2,
  Search,
  Megaphone,
  Cpu,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<TeamType | ''>('');
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    // If user already has a team set, navigate to dashboard directly
    if (profile?.team) {
      navigate('/user/dashboard');
    }
  }, [profile, navigate]);

  const teamIconMap: Record<TeamType, React.ReactNode> = {
    'Backend Engineer': <Server className="w-5 h-5 text-indigo-500" />,
    'Frontend Engineer': <Layout className="w-5 h-5 text-sky-500" />,
    'Social Media Handler': <Share2 className="w-5 h-5 text-pink-500" />,
    'Research Team': <Search className="w-5 h-5 text-purple-500" />,
    'Marketing Team': <Megaphone className="w-5 h-5 text-amber-500" />,
    'AIML Team': <Cpu className="w-5 h-5 text-emerald-500" />,
    Learner: <GraduationCap className="w-5 h-5 text-blue-500" />,
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) {
      error('Please select a team/role to continue');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await updateUserProfileDoc(user.uid, {
        team: selectedTeam as TeamType,
        designation: designation.trim() || selectedTeam,
      });

      await refreshProfile();
      success(`Welcome to the ${selectedTeam}!`);
      navigate('/user/dashboard');
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-[#09090b]">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white shadow-md mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome to the Team
          </h1>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            What role or department are you working with at AeroTask?
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
                Select your team
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TEAMS.map((teamName) => {
                  const isSelected = selectedTeam === teamName;
                  return (
                    <div
                      key={teamName}
                      onClick={() => setSelectedTeam(teamName)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-left ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          {teamIconMap[teamName]}
                        </div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                          {teamName}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Input
              label="Job Title / Designation (Optional)"
              placeholder="e.g. Senior Backend Engineer, Content Strategist"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              helperText="You can also modify this later in your profile settings."
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!selectedTeam}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Enter AeroTask Workspace
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
