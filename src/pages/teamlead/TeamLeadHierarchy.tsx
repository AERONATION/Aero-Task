import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getReportingTree, HierarchyNode } from '@/services/teamLeadService';
import { UserProfile } from '@/types/user';
import { Avatar } from '@/components/ui/Avatar';
import { GitBranch, ChevronDown, ChevronRight, User, Shield, Briefcase } from 'lucide-react';

interface TreeNodeProps {
  node: HierarchyNode;
  depth?: number;
  isRoot?: boolean;
}

const DEPTH_COLORS = [
  'border-indigo-400 dark:border-indigo-600',
  'border-violet-400 dark:border-violet-600',
  'border-blue-400 dark:border-blue-600',
];

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth = 0, isRoot = false }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const { profile } = node;
  const hasChildren = node.directReports.length > 0;
  const borderColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  const getRoleBadge = (p: UserProfile) => {
    if (p.systemRole === 'admin') return { label: 'Admin', bg: 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300', icon: <Shield className="w-2.5 h-2.5" /> };
    if (p.systemRole === 'team_lead' || p.isTeamLead) return { label: 'Team Lead', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300', icon: <Briefcase className="w-2.5 h-2.5" /> };
    return { label: 'Member', bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300', icon: <User className="w-2.5 h-2.5" /> };
  };

  const badge = getRoleBadge(profile);

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 ' + borderColor : ''}`}>
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
          isRoot
            ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/20'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
        } mb-2`}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        {/* Avatar */}
        <Avatar
          src={profile.photoURL}
          name={profile.name}
          size="md"
          colorClass={isRoot ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{profile.name}</span>
            <span className={`flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg}`}>
              {badge.icon} {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {profile.designation && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{profile.designation}</span>
            )}
            {profile.team && (
              <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                {profile.team}
              </span>
            )}
            {profile.email && (
              <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">{profile.email}</span>
            )}
          </div>
        </div>

        {/* Expand/Collapse */}
        {hasChildren && (
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400">{node.directReports.length} report{node.directReports.length !== 1 ? 's' : ''}</span>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        )}
        {!hasChildren && (
          <span className="text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">No reports</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mb-2">
          {node.directReports.map((child) => (
            <TreeNode key={child.profile.uid} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TeamLeadHierarchy: React.FC = () => {
  const { user } = useAuth();
  const [tree, setTree] = useState<HierarchyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getReportingTree(user.uid, 4)
      .then(setTree)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const countNodes = (node: HierarchyNode): number =>
    1 + node.directReports.reduce((acc, n) => acc + countNodes(n), 0);

  const totalMembers = tree ? countNodes(tree) - 1 : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-500" /> Reporting Hierarchy
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Visual org tree — your reporting chain and all direct/indirect reports
          {totalMembers > 0 && <span className="ml-2 font-semibold text-zinc-700 dark:text-zinc-200">({totalMembers} member{totalMembers !== 1 ? 's' : ''})</span>}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-zinc-400">Building hierarchy tree...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-700 dark:text-rose-300">
          Failed to load hierarchy: {error}
        </div>
      ) : !tree ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-xs text-zinc-400">
          Profile not found in the system.
        </div>
      ) : (
        <div>
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Depth:</span>
            {DEPTH_COLORS.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-4 h-0.5 border-l-2 ${c} inline-block`} />
                <span className="text-xs text-zinc-500">Level {i + 1}</span>
              </div>
            ))}
          </div>
          <TreeNode node={tree} depth={0} isRoot={true} />
        </div>
      )}
    </div>
  );
};
