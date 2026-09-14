import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminTasks } from '@/hooks/useAdminTasks';
import { useUsers } from '@/hooks/useUsers';
import { useWorkload } from '@/hooks/useWorkload';
import { EmployeeWorkload, CAPACITY_META, RISK_META, exportWorkloadCSV, CapacityLabel, BurnoutRisk } from '@/services/workloadService';
import { WorkloadGauge, WorkloadBarChart, MiniBar } from '@/components/charts/WorkloadCharts';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { TEAMS, TeamType } from '@/types/user';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Flame,
  Activity,
  Download,
  Filter,
  LayoutGrid,
  Table2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ─── KPI Card ─────────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  sub,
  icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2">
        <span>{label}</span>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-zinc-400">{sub}</div>}
    </div>
  );
}

/* ─── Employee Workload Card ───────────────────────────────────────────── */

function EmployeeCard({ w, maxActive }: { w: EmployeeWorkload; maxActive: number }) {
  const cap  = CAPACITY_META[w.capacityLabel];
  const risk = RISK_META[w.burnoutRisk];

  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col gap-4">
      {/* Header: Avatar + Name + Gauge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl ${cap.bg} ${cap.darkBg} ${cap.color} font-bold text-sm flex items-center justify-center shrink-0`}>
            {initials(w.user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{w.user.name}</p>
            {w.user.designation && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{w.user.designation}</p>
            )}
            {w.user.team && (
              <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {w.user.team}
              </span>
            )}
          </div>
        </div>

        {/* Score Gauge */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <WorkloadGauge score={w.workloadScore} size={52} />
        </div>
      </div>

      {/* Capacity + Risk badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cap.bg} ${cap.darkBg} ${cap.color}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cap.bar }} />
          {cap.label}
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-800 ${risk.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${risk.dotColor}`} />
          {risk.label}
        </span>
        {w.tasksDueThisWeek > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-2.5 h-2.5" />
            {w.tasksDueThisWeek} due soon
          </span>
        )}
      </div>

      {/* Mini bars */}
      <div className="space-y-2">
        <MiniBar label="Active"   value={w.activeTasks}      max={Math.max(maxActive, 1)} color="#6366f1" />
        <MiniBar label="Overdue"  value={w.overdueTasks}     max={Math.max(maxActive, 1)} color="#f43f5e" />
        <MiniBar label="Urgent"   value={w.urgentTasks}      max={Math.max(maxActive, 1)} color="#f97316" />
        <MiniBar label="Done/Mo." value={w.completedThisMonth} max={Math.max(maxActive, 1)} color="#10b981" />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
        {[
          { label: 'Total', value: w.totalTasks },
          { label: 'In Progress', value: w.inProgressTasks },
          { label: 'Avg (days)', value: w.avgCompletionDays || '—' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{s.value}</p>
            <p className="text-[10px] text-zinc-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View Profile link */}
      <Link
        to={`/admin/users/${w.user.uid}`}
        className="flex items-center justify-center gap-1.5 w-full text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
      >
        View Full Profile <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

/* ─── Capacity Matrix Table Row ────────────────────────────────────────── */

function TableRow({ w, rank }: { w: EmployeeWorkload; rank: number }) {
  const cap  = CAPACITY_META[w.capacityLabel];
  const risk = RISK_META[w.burnoutRisk];

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-4 py-3 text-xs text-zinc-400 font-mono w-8">{rank}</td>
      <td className="px-4 py-3">
        <Link to={`/admin/users/${w.user.uid}`} className="flex items-center gap-2.5 group">
          <div className={`w-7 h-7 rounded-lg ${cap.bg} ${cap.darkBg} ${cap.color} text-[11px] font-bold flex items-center justify-center shrink-0`}>
            {initials(w.user.name)}
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{w.user.name}</p>
            <p className="text-[10px] text-zinc-400 truncate max-w-[140px]">{w.user.designation || w.user.email}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">{w.user.team || '—'}</td>
      <td className="px-4 py-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200 text-center">{w.activeTasks}</td>
      <td className="px-4 py-3 text-center">
        <span className={`text-xs font-semibold ${w.overdueTasks > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'}`}>
          {w.overdueTasks}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-xs font-semibold ${w.urgentTasks > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400'}`}>
          {w.urgentTasks}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-center text-emerald-600 dark:text-emerald-400 font-semibold">{w.completedThisMonth}</td>
      <td className="px-4 py-3 text-xs text-center text-zinc-500">{w.avgCompletionDays ? `${w.avgCompletionDays}d` : '—'}</td>
      <td className="px-4 py-3 text-center">
        {/* Score bar */}
        <div className="flex items-center gap-2 justify-end">
          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${w.workloadScore}%`, backgroundColor: cap.bar }} />
          </div>
          <span className="text-xs font-bold" style={{ color: cap.bar }}>{w.workloadScore}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-[10px] font-semibold ${risk.color}`}>{risk.label}</span>
      </td>
    </tr>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

type ViewMode = 'grid' | 'table';

export const AdminWorkload: React.FC = () => {
  const { allTasks, loading: tasksLoading } = useAdminTasks();
  const { users, loading: usersLoading }    = useUsers();
  const { workloads, orgStats }             = useWorkload(allTasks, users);

  const loading = tasksLoading || usersLoading;

  /* Filters */
  const [viewMode,     setViewMode]     = useState<ViewMode>('grid');
  const [teamFilter,   setTeamFilter]   = useState<string>('all');
  const [riskFilter,   setRiskFilter]   = useState<string>('all');
  const [capacityFilter, setCapacity]   = useState<string>('all');
  const [page,         setPage]         = useState(0);
  const PAGE_SIZE = 10;

  /* Filtered workloads */
  const filtered = useMemo(() => {
    return workloads.filter((w) => {
      if (teamFilter     !== 'all' && w.user.team     !== teamFilter)    return false;
      if (riskFilter     !== 'all' && w.burnoutRisk   !== riskFilter)    return false;
      if (capacityFilter !== 'all' && w.capacityLabel !== capacityFilter) return false;
      return true;
    });
  }, [workloads, teamFilter, riskFilter, capacityFilter]);

  const maxActive = useMemo(() => Math.max(1, ...filtered.map((w) => w.activeTasks)), [filtered]);

  /* Pagination for table */
  const pageCount   = Math.ceil(filtered.length / PAGE_SIZE);
  const paged       = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = () => setPage(0);

  const atRiskEmployees = workloads.filter(
    (w) => w.burnoutRisk === 'high' || w.burnoutRisk === 'critical'
  );

  /* ── Score bar color */
  const scoreBarColor = (score: number) => {
    if (score > 90) return 'from-rose-500 to-rose-600';
    if (score > 75) return 'from-orange-500 to-orange-600';
    if (score > 50) return 'from-amber-500 to-amber-600';
    if (score > 25) return 'from-emerald-500 to-emerald-600';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <div className="space-y-6 text-left">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Workforce Capacity Monitor
            </h2>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold">
              Admin
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Real-time employee workload, capacity health, and burnout risk across the organization
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-xs">
            {([['grid', <LayoutGrid className="w-3.5 h-3.5" />], ['table', <Table2 className="w-3.5 h-3.5" />]] as [ViewMode, React.ReactNode][]).map(([mode, icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === 'grid' ? 'Card Grid' : 'Table View'}
                className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center ${
                  viewMode === mode
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {/* Export */}
          <button
            onClick={() => exportWorkloadCSV(workloads)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Total Employees"
            value={orgStats.totalEmployees}
            sub="Active team members"
            icon={<Users className="w-4 h-4" />}
            iconColor="text-indigo-500"
          />
          <KpiCard
            label="Avg Workload Score"
            value={`${orgStats.avgWorkloadScore}/100`}
            sub="Organisation capacity level"
            icon={<Activity className="w-4 h-4" />}
            iconColor="text-brand-500"
          />
          <KpiCard
            label="Overloaded Members"
            value={orgStats.overloadedCount}
            sub="Score above 75"
            icon={<TrendingUp className="w-4 h-4" />}
            iconColor="text-orange-500"
          />
          <KpiCard
            label="Burnout Risk"
            value={orgStats.burnoutRiskCount}
            sub={`${orgStats.criticalCount} critical`}
            icon={<Flame className="w-4 h-4" />}
            iconColor="text-rose-500"
          />
          <KpiCard
            label="Under-utilized"
            value={orgStats.underutilizedCount}
            sub="Score ≤ 25, capacity free"
            icon={<UserCheck className="w-4 h-4" />}
            iconColor="text-emerald-500"
          />
        </div>
      )}

      {/* ── Org Capacity Health Bar ─────────────────────────────────────── */}
      {!loading && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Organization Capacity Distribution</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Breakdown of all {orgStats.totalEmployees} employees by workload capacity level</p>
            </div>
            <span className={`text-sm font-bold ${
              orgStats.avgWorkloadScore > 75 ? 'text-rose-600' :
              orgStats.avgWorkloadScore > 50 ? 'text-amber-600' :
              orgStats.avgWorkloadScore > 25 ? 'text-emerald-600' : 'text-blue-600'
            }`}>
              {orgStats.capacityUtilization}% utilized
            </span>
          </div>
          {/* Stacked capacity bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {(['under', 'normal', 'high', 'over', 'maxed'] as CapacityLabel[]).map((cap) => {
              const count = workloads.filter((w) => w.capacityLabel === cap).length;
              const pct   = orgStats.totalEmployees > 0 ? (count / orgStats.totalEmployees) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={cap}
                  style={{ width: `${pct}%`, backgroundColor: CAPACITY_META[cap].bar }}
                  title={`${CAPACITY_META[cap].label}: ${count} (${Math.round(pct)}%)`}
                  className="transition-all duration-500"
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
            {(['under', 'normal', 'high', 'over', 'maxed'] as CapacityLabel[]).map((cap) => {
              const count = workloads.filter((w) => w.capacityLabel === cap).length;
              return (
                <div key={cap} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CAPACITY_META[cap].bar }} />
                  {CAPACITY_META[cap].label}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters Row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </div>
        {/* Team */}
        <select
          value={teamFilter}
          onChange={(e) => { setTeamFilter(e.target.value); handleFilterChange(); }}
          className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Teams</option>
          {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {/* Burnout Risk */}
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); handleFilterChange(); }}
          className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">🔥 Critical</option>
          <option value="high">⚠ High Risk</option>
          <option value="moderate">Moderate</option>
          <option value="safe">Safe</option>
        </select>
        {/* Capacity */}
        <select
          value={capacityFilter}
          onChange={(e) => { setCapacity(e.target.value); handleFilterChange(); }}
          className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Capacity</option>
          <option value="maxed">Maxed Out</option>
          <option value="over">Overloaded</option>
          <option value="high">High Load</option>
          <option value="normal">Normal</option>
          <option value="under">Under-utilized</option>
        </select>
        <span className="text-xs text-zinc-400 ml-auto">
          Showing {filtered.length} of {workloads.length} employees
        </span>
      </div>

      {/* ── Main Content: Grid or Table ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No employees match the selected filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((w) => (
            <EmployeeCard key={w.user.uid} w={w} maxActive={maxActive} />
          ))}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
                  {['#', 'Employee', 'Team', 'Active', 'Overdue', 'Urgent', 'Done/Mo.', 'Avg Time', 'Score', 'Risk'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((w, i) => (
                  <TableRow key={w.user.uid} w={w} rank={page * PAGE_SIZE + i + 1} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-400">
                Page {page + 1} of {pageCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Load Distribution Chart ──────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            Active Task Load Distribution
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4">
            Number of active (todo + in-progress) tasks per employee — color coded by capacity level
          </p>
          <WorkloadBarChart workloads={filtered} maxEmployees={15} />
        </div>
      )}

      {/* ── Burnout Risk Alert Panel ─────────────────────────────────────── */}
      {!loading && atRiskEmployees.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Burnout Risk Alert — {atRiskEmployees.length} Employee{atRiskEmployees.length > 1 ? 's' : ''} Flagged
              </h3>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                Immediate attention recommended. Consider task reassignment or deadline adjustments.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {atRiskEmployees.map((w) => {
              const risk = RISK_META[w.burnoutRisk];
              const reasons: string[] = [];
              if (w.overdueTasks >= 2)  reasons.push(`${w.overdueTasks} overdue tasks`);
              if (w.urgentTasks >= 2)   reasons.push(`${w.urgentTasks} urgent tasks`);
              if (w.activeTasks >= 5)   reasons.push(`${w.activeTasks} active tasks`);
              if (w.tasksDueThisWeek >= 3) reasons.push(`${w.tasksDueThisWeek} due this week`);

              return (
                <div
                  key={w.user.uid}
                  className="flex items-start sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-rose-200 dark:border-rose-800/60 flex-col sm:flex-row"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-sm flex items-center justify-center shrink-0">
                      {initials(w.user.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{w.user.name}</p>
                        <span className={`text-[10px] font-bold ${risk.color}`}>{risk.label}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {reasons.join(' · ') || 'High workload detected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                      <Flame className="w-3.5 h-3.5" />
                      Score: {w.workloadScore}
                    </div>
                    <Link
                      to={`/admin/users/${w.user.uid}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                    >
                      View <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
