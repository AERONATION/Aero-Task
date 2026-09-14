import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { EmployeeWorkload, CAPACITY_META } from '@/services/workloadService';

/* ─── Workload Score Gauge (Custom SVG — no extra lib) ─────────────────── */

interface GaugeProps {
  score: number;   // 0–100
  size?: number;
}

export const WorkloadGauge: React.FC<GaugeProps> = ({ score, size = 64 }) => {
  const r        = (size / 2) - 6;
  const cx       = size / 2;
  const cy       = size / 2;
  const circ     = 2 * Math.PI * r;
  const filled   = (score / 100) * circ;
  const empty    = circ - filled;

  // Color based on score
  let color = '#10b981'; // emerald
  if (score > 90) color = '#f43f5e'; // rose
  else if (score > 75) color = '#f97316'; // orange
  else if (score > 50) color = '#f59e0b'; // amber
  else if (score <= 25) color = '#3b82f6'; // blue

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        className="text-zinc-200 dark:text-zinc-700"
      />
      {/* Fill */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${filled} ${empty}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Score text */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size < 56 ? 10 : 13}
        fontWeight={700}
        fontFamily="inherit"
      >
        {score}
      </text>
    </svg>
  );
};

/* ─── Horizontal Load Distribution Bar Chart ──────────────────────────── */

interface LoadBarChartProps {
  workloads: EmployeeWorkload[];
  maxEmployees?: number;
}

interface ChartDatum {
  name: string;
  active: number;
  completed: number;
  overdue: number;
  score: number;
  capacity: string;
  barColor: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d: ChartDatum = payload[0]?.payload;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-white shadow-xl">
      <p className="font-bold mb-1.5 text-zinc-100">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">Active Tasks</span>
          <span className="font-semibold">{d?.active}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">Overdue</span>
          <span className="font-semibold text-rose-400">{d?.overdue}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">Completed</span>
          <span className="font-semibold text-emerald-400">{d?.completed}</span>
        </div>
        <div className="flex items-center justify-between gap-6 pt-1 border-t border-zinc-700">
          <span className="text-zinc-400">Score</span>
          <span className="font-bold" style={{ color: d?.barColor }}>{d?.score}/100</span>
        </div>
      </div>
    </div>
  );
};

export const WorkloadBarChart: React.FC<LoadBarChartProps> = ({
  workloads,
  maxEmployees = 15,
}) => {
  const data: ChartDatum[] = workloads
    .slice(0, maxEmployees)
    .map((w) => ({
      name: w.user.name.split(' ')[0] + (w.user.name.split(' ')[1] ? ` ${w.user.name.split(' ')[1][0]}.` : ''),
      active:    w.activeTasks,
      completed: w.completedThisMonth,
      overdue:   w.overdueTasks,
      score:     w.workloadScore,
      capacity:  w.capacityLabel,
      barColor:  CAPACITY_META[w.capacityLabel].bar,
    }))
    .reverse(); // bottom-heavy → highest score at top in horizontal chart

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
        No employee data available.
      </div>
    );
  }

  const barHeight = 32;
  const chartHeight = Math.max(200, data.length * barHeight + 60);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="rgba(161,161,170,0.15)"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={90}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(161,161,170,0.08)' }} />
          <Bar dataKey="active" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ─── Mini Stat Bar (used in employee cards) ──────────────────────────── */

interface MiniBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

export const MiniBar: React.FC<MiniBarProps> = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-16 shrink-0 text-zinc-500 dark:text-zinc-400">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-5 text-right font-semibold text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
};
