import { useMemo } from 'react';
import { Task } from '@/types/task';
import { UserProfile } from '@/types/user';
import {
  calculateEmployeeWorkloads,
  getOrgWorkloadStats,
  EmployeeWorkload,
  OrgWorkloadStats,
  CapacityLabel,
  BurnoutRisk,
} from '@/services/workloadService';

export type { EmployeeWorkload, OrgWorkloadStats, CapacityLabel, BurnoutRisk };

export interface UseWorkloadResult {
  workloads: EmployeeWorkload[];
  orgStats: OrgWorkloadStats;
}

/**
 * Derives per-employee workload metrics from already-loaded tasks + users.
 * Memoized — only recomputes when tasks or users arrays change.
 */
export function useWorkload(
  tasks: Task[],
  users: UserProfile[]
): UseWorkloadResult {
  return useMemo(() => {
    const workloads = calculateEmployeeWorkloads(tasks, users);
    const orgStats  = getOrgWorkloadStats(workloads);
    return { workloads, orgStats };
  }, [tasks, users]);
}
