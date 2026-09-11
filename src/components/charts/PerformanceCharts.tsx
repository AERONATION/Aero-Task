import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TeamPerformanceData, TrendPoint } from '@/services/analyticsService';

interface StatusDistributionProps {
  data: { name: string; value: number; color: string }[];
}

export const StatusDistributionChart: React.FC<StatusDistributionProps> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs">
        No task status data available yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-zinc-600 dark:text-zinc-400">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface OnTimeVsLateProps {
  data: { name: string; value: number; color: string }[];
}

export const OnTimeVsLateChart: React.FC<OnTimeVsLateProps> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs">
        No completed tasks to evaluate on-time delivery.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-ontime-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-zinc-600 dark:text-zinc-400">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface CompletionTrendProps {
  data: TrendPoint[];
}

export const CompletionTrendChart: React.FC<CompletionTrendProps> = ({ data }) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.6} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 capitalize">
                {value}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Tasks Completed"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#10b981' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="created"
            name="Tasks Created"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 2.5, fill: '#6366f1' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface CompletedVsPendingProps {
  completed: number;
  pending: number;
  inProgress: number;
}

export const CompletedVsPendingChart: React.FC<CompletedVsPendingProps> = ({
  completed,
  pending,
  inProgress,
}) => {
  const chartData = [
    { name: 'To Do', count: pending, fill: '#94a3b8' },
    { name: 'In Progress', count: inProgress, fill: '#f59e0b' },
    { name: 'Completed', count: completed, fill: '#10b981' },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.6} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-bar-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface TeamPerformanceChartProps {
  data: TeamPerformanceData[];
}

export const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ data }) => {
  const formattedData = data.map((t) => ({
    team: t.team.replace(' Team', '').replace(' Engineer', ''),
    fullTeam: t.team,
    completed: t.completedTasks,
    pending: t.pendingTasks,
    completionRate: t.completionRate,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.6} />
          <XAxis
            dataKey="team"
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
            tick={{ fontSize: 10, fill: '#71717a' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 capitalize">
                {value}
              </span>
            )}
          />
          <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" name="Pending / In Progress" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
