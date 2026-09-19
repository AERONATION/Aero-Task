import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfileDoc } from '@/services/userService';
import { updateFirebaseProfile } from '@/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  TEAMS,
  TeamType,
  EMPLOYMENT_TYPES,
  EmploymentType,
  EXPERIENCE_LEVELS,
  ExperienceLevel,
  SocialLinks,
} from '@/types/user';
import { formatDate } from '@/utils/date';
import { useToast } from '@/context/ToastContext';
import { ThemeSelector } from '@/components/ui/ThemeToggle';
import {
  User,
  Mail,
  Shield,
  Briefcase,
  Calendar,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Globe,
  Code2,
  AtSign,
  Link2,
  Tag,
  Building2,
  BadgeCheck,
  Info,
  Layers,
  Users,
  AlertCircle,
  Edit3,
  X,
  Plus,
  Hash,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────── */
const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
];

function initials(name?: string | null) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
          {icon}
        </span>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">{title}</h4>
          {subtitle && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─── Skills tag input ──────────────────────────────────────── */
function SkillsInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInput('');
  };

  const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

  return (
    <div className="w-full space-y-1.5 text-left">
      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
        Skills & Expertise
      </label>
      <div className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
          >
            {skill}
            <button
              type="button"
              onClick={() => remove(skill)}
              className="text-brand-400 hover:text-brand-700 dark:hover:text-brand-200 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
          placeholder="Type skill + Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
        />
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">Press Enter or comma to add a skill</p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error } = useToast();

  // ── Personal Section State ──
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [timezone, setTimezone] = useState(profile?.timezone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [emergencyContact, setEmergencyContact] = useState(profile?.emergencyContact || '');

  // ── Professional Section State ──
  const [designation, setDesignation] = useState(profile?.designation || '');
  const [team, setTeam] = useState<TeamType | ''>(profile?.team || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [employeeId, setEmployeeId] = useState(profile?.employeeId || '');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(
    profile?.employmentType || ''
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>(
    profile?.experienceLevel || ''
  );

  // ── Skills ──
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);

  // ── Social Links ──
  const [linkedin, setLinkedin] = useState(profile?.socialLinks?.linkedin || '');
  const [github, setGithub] = useState(profile?.socialLinks?.github || '');
  const [twitter, setTwitter] = useState(profile?.socialLinks?.twitter || '');
  const [portfolio, setPortfolio] = useState(profile?.socialLinks?.portfolio || '');

  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      error('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateFirebaseProfile(user, { displayName: name.trim() });

      const socialLinks: SocialLinks = {};
      if (linkedin.trim()) socialLinks.linkedin = linkedin.trim();
      if (github.trim()) socialLinks.github = github.trim();
      if (twitter.trim()) socialLinks.twitter = twitter.trim();
      if (portfolio.trim()) socialLinks.portfolio = portfolio.trim();

      await updateUserProfileDoc(user.uid, {
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        timezone: timezone || undefined,
        bio: bio.trim(),
        emergencyContact: emergencyContact.trim(),
        designation: designation.trim(),
        team: team ? (team as TeamType) : undefined,
        department: department.trim(),
        employeeId: employeeId.trim(),
        employmentType: employmentType ? (employmentType as EmploymentType) : undefined,
        experienceLevel: experienceLevel ? (experienceLevel as ExperienceLevel) : undefined,
        skills,
        socialLinks,
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

  /* ── completion score ── */
  const fields = [
    name, phone, location, timezone, bio, designation,
    team, department, employmentType, experienceLevel,
    ...(skills.length ? ['skills'] : []),
    ...(linkedin || github || portfolio ? ['social'] : []),
  ];
  const filledCount = fields.filter(Boolean).length;
  const totalFields = 12;
  const completionPct = Math.min(100, Math.round((filledCount / totalFields) * 100));

  return (
    <form onSubmit={handleUpdate}>
      <div className="max-w-4xl mx-auto space-y-6 text-left">

        {/* ── Page Header ── */}
        <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            My Profile
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Manage your professional identity, contact details, and workplace settings.
          </p>
        </div>

        {/* ── Hero Card ── */}
        <div className="relative bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-950 rounded-2xl p-6 overflow-hidden shadow-md">
          {/* bg decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white" />
          </div>

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name || 'User'}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white/30 shrink-0 select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur text-white font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-white/30 shrink-0 select-none">
                {initials(profile?.name || user?.displayName)}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-white truncate">
                  {profile?.name || user?.displayName || 'Teammate'}
                </h3>
                <span
                  className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full ${
                    profile?.systemRole === 'admin'
                      ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                      : 'bg-white/10 text-white/80 border border-white/20'
                  }`}
                >
                  {profile?.systemRole === 'admin' ? 'Administrator' : 'Team Member'}
                </span>
                {profile?.employmentType && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/20">
                    {profile.employmentType}
                  </span>
                )}
              </div>

              <p className="text-sm text-white/70 mt-1">{user?.email}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-white/60">
                {profile?.designation && (
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-white/50" />
                    {profile.designation}
                  </span>
                )}
                {profile?.team && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-white/50" />
                    {profile.team}
                  </span>
                )}
                {profile?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-white/50" />
                    {profile.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-white/50" />
                  Joined {formatDate(profile?.createdAt)}
                </span>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="shrink-0 w-28 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" strokeWidth="6" className="stroke-white/20" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionPct / 100)}`}
                    strokeLinecap="round"
                    className="stroke-white transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{completionPct}%</span>
                </div>
              </div>
              <p className="text-[11px] text-white/60 mt-1.5 leading-tight">Profile<br />Complete</p>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Employee ID', value: profile?.employeeId || '—', icon: <Hash className="w-4 h-4" /> },
            { label: 'Department', value: profile?.department || profile?.team || '—', icon: <Building2 className="w-4 h-4" /> },
            { label: 'Experience', value: profile?.experienceLevel || '—', icon: <Layers className="w-4 h-4" /> },
            { label: 'Timezone', value: profile?.timezone || '—', icon: <Clock className="w-4 h-4" /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3"
            >
              <span className="text-brand-500 shrink-0">{stat.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">{stat.label}</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Personal Information ── */}
          <SectionCard
            title="Personal Information"
            subtitle="Your basic contact and identity details"
            icon={<User className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="Your full name"
                required
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="Managed by your Firebase account."
              />
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Location / City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                placeholder="e.g. Bengaluru, India"
              />
              <Select
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="">Select timezone...</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
              <Textarea
                label="Bio / About Me"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief professional summary..."
                rows={3}
                helperText="Visible to colleagues on your profile."
              />
              <Input
                label="Emergency Contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                leftIcon={<AlertCircle className="w-4 h-4" />}
                placeholder="Name — +91 XXXXX XXXXX"
                helperText="Not shared publicly, used for HR records."
              />
            </div>
          </SectionCard>

          {/* ── Professional Information ── */}
          <SectionCard
            title="Professional Details"
            subtitle="Your role, team, and employment status"
            icon={<Briefcase className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <Input
                label="Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                placeholder="e.g. EMP-2024-001"
              />
              <Input
                label="Job Title / Designation"
                placeholder="e.g. Senior Frontend Engineer"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                leftIcon={<BadgeCheck className="w-4 h-4" />}
              />
              <Input
                label="Department Name"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                leftIcon={<Building2 className="w-4 h-4" />}
                placeholder="e.g. Product Engineering"
              />
              <Select
                label="Team / Squad"
                value={team}
                onChange={(e) => setTeam(e.target.value as TeamType)}
              >
                <option value="">Select team...</option>
                {TEAMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Employment Type"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                >
                  <option value="">Select type...</option>
                  {EMPLOYMENT_TYPES.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </Select>
                <Select
                  label="Experience Level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                >
                  <option value="">Select level...</option>
                  {EXPERIENCE_LEVELS.map((el) => (
                    <option key={el} value={el}>{el}</option>
                  ))}
                </Select>
              </div>

              {/* Skills */}
              <SkillsInput skills={skills} onChange={setSkills} />

              {/* Account Info (read-only) */}
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Account Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'System Role', value: profile?.systemRole === 'admin' ? 'Administrator' : 'Team Member', icon: <Shield className="w-3.5 h-3.5" /> },
                    { label: 'Status', value: profile?.isActive ? 'Active' : 'Inactive', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                    { label: 'Joined', value: formatDate(profile?.createdAt), icon: <Calendar className="w-3.5 h-3.5" /> },
                    { label: 'Last Login', value: formatDate(profile?.lastLoginAt), icon: <Clock className="w-3.5 h-3.5" /> },
                  ].map((item) => (
                    <div key={item.label} className="space-y-0.5">
                      <p className="text-[10px] uppercase text-zinc-400 font-medium flex items-center gap-1">
                        {item.icon} {item.label}
                      </p>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Social & Online Presence ── */}
        <SectionCard
          title="Social & Online Presence"
          subtitle="Share your professional profiles and portfolio"
          icon={<Globe className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="LinkedIn"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              leftIcon={<AtSign className="w-4 h-4" />}
              placeholder="https://linkedin.com/in/username"
            />
            <Input
              label="GitHub"
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              leftIcon={<Code2 className="w-4 h-4" />}
              placeholder="https://github.com/username"
            />
            <Input
              label="Twitter / X"
              type="url"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              leftIcon={<AtSign className="w-4 h-4" />}
              placeholder="https://twitter.com/username"
            />
            <Input
              label="Portfolio / Website"
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              leftIcon={<Link2 className="w-4 h-4" />}
              placeholder="https://yourportfolio.com"
            />
          </div>
        </SectionCard>

        {/* ── Appearance ── */}
        <SectionCard
          title="Appearance & Theme"
          subtitle="Choose your preferred interface theme"
          icon={<Edit3 className="w-4 h-4" />}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Interface Theme</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Light, Dark, or System automatic sync</p>
            </div>
            <ThemeSelector />
          </div>
        </SectionCard>

        {/* ── Save ── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <span className="text-xs text-zinc-400">
            Last updated: {formatDate(profile?.updatedAt)}
          </span>
          <Button
            type="submit"
            size="sm"
            loading={loading}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Save All Changes
          </Button>
        </div>
      </div>
    </form>
  );
};
