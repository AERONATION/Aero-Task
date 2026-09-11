import React, { useState, useMemo } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useAdminTasks } from '@/hooks/useAdminTasks';
import { TEAMS, TeamType, UserProfile } from '@/types/user';
import { Task, TaskStatus } from '@/types/task';
import { calculatePerformanceMetrics } from '@/services/analyticsService';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { updateTaskStatus, deleteTask } from '@/services/taskService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Server,
  Layout,
  Share2,
  Search,
  Megaphone,
  Cpu,
  GraduationCap,
  ChevronRight,
  Plus,
} from 'lucide-react';

export const AdminTeams: React.FC = () => {
  const { users, usersMap, loading: usersLoading } = useUsers();
  const { allTasks, loading: tasksLoading } = useAdminTasks();
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('Backend Engineer');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const { success, error } = useToast();

  const loading = usersLoading || tasksLoading;

  const teamIconMap: Record<TeamType, React.ReactNode> = {
    'Backend Engineer': <Server className="w-5 h-5 text-indigo-500" />,
    'Frontend Engineer': <Layout className="w-5 h-5 text-sky-500" />,
    'Social Media Handler': <Share2 className="w-5 h-5 text-pink-500" />,
    'Research Team': <Search className="w-5 h-5 text-purple-500" />,
    'Marketing Team': <Megaphone className="w-5 h-5 text-amber-500" />,
    'AIML Team': <Cpu className="w-5 h-5 text-emerald-500" />,
    Learner: <GraduationCap className="w-5 h-5 text-blue-500" />,
  };

  // Metrics across all 7 teams
  const teamMetricsMap = useMemo(() => {
    const map = new Map<TeamType, {
      members: UserProfile[];
      tasks: Task[];
      metrics: ReturnType<typeof calculatePerformanceMetrics>;
    }>();

    TEAMS.forEach((team) => {
      const members = users.filter((u) => u.team === team);
      const memberUids = new Set(members.map((m) => m.uid));
      const tasks = allTasks.filter(
        (t) => t.team === team || (t.assignedTo && memberUids.has(t.assignedTo))
      );
      const metrics = calculatePerformanceMetrics(tasks);
      map.set(team, { members, tasks, metrics });
    });

    return map;
  }, [users, allTasks]);

  const currentTeamData = teamMetricsMap.get(selectedTeam) || {
    members: [],
    tasks: [],
    metrics: calculatePerformanceMetrics([]),
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const targetTask = currentTeamData.tasks.find((t) => t.id === taskId);
    if (!targetTask || !user) return;
    try {
      await updateTaskStatus(taskId, newStatus, targetTask, user.uid, 'Admin');
      success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      error(err.message || 'Failed to update task');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Department Performance & Workload
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Compare throughput, completion rates, and rosters across all 7 internal teams
          </p>
        </div>

        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Assign to Team</span>
        </button>
      </div>

      {/* 7 Teams Overview Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {TEAMS.map((teamName) => {
          const data = teamMetricsMap.get(teamName) || {
            members: [],
            tasks: [],
            metrics: calculatePerformanceMetrics([]),
          };
          const isSelected = selectedTeam === teamName;

          return (
            <div
              key={teamName}
              onClick={() => setSelectedTeam(teamName)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand-500 bg-white dark:bg-zinc-900 ring-2 ring-brand-500/20 shadow-md'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {teamIconMap[teamName]}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight line-clamp-1">
                      {teamName}
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      {data.members.length} {data.members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  {data.metrics.completionRate}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-center text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Tasks</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {data.metrics.totalTasks}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Done</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {data.metrics.completedTasks}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Overdue</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {data.metrics.overdueTasks}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Team Drill-Down Section */}
      <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              {teamIconMap[selectedTeam]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {selectedTeam} Overview
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Detailed rosters, workload, and performance metrics
              </p>
            </div>
          </div>
        </div>

        {/* Selected Team KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <span className="text-xs text-zinc-400">Total Deliverables</span>
            <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
              {currentTeamData.metrics.totalTasks}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <span className="text-xs text-zinc-400">Completed On-Time</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {currentTeamData.metrics.onTimeCompletedTasks}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <span className="text-xs text-zinc-400">Pending / In Progress</span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {currentTeamData.metrics.pendingTasks + currentTeamData.metrics.inProgressTasks}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <span className="text-xs text-zinc-400">Overdue Deliverables</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {currentTeamData.metrics.overdueTasks}
            </div>
          </div>
        </div>

        {/* Team Members Roster */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Team Members ({currentTeamData.members.length})
          </h4>

          {currentTeamData.members.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3">No members currently assigned to this team.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentTeamData.members.map((m) => (
                <Link
                  key={m.uid}
                  to={`/admin/users/${m.uid}`}
                  className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-2 group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold text-xs flex items-center justify-center shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-brand-600 transition-colors">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {m.designation || 'Staff'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Team Tasks Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Team Tasks ({currentTeamData.tasks.length})
          </h4>

          {currentTeamData.tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 border border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
              No tasks currently registered for the {selectedTeam}.
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <TaskTable
                  tasks={currentTeamData.tasks}
                  usersMap={usersMap}
                  showAssignee={true}
                  onStatusChange={handleStatusChange}
                  onEdit={(t) => {
                    setTaskToEdit(t);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={() => {}}
                />
              </div>
              <div className="md:hidden space-y-3">
                {currentTeamData.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assignedUser={usersMap.get(task.assignedTo)}
                    onStatusChange={handleStatusChange}
                    onEdit={(t) => {
                      setTaskToEdit(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
          task={taskToEdit}
          users={users}
        />
      )}
    </div>
  );
};
