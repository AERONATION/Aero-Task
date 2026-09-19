import {
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db, usersCol, tasksCol } from '@/firebase/firestore';
import { UserProfile } from '@/types/user';
import { Task } from '@/types/task';
import { createTask, CreateTaskInput } from './taskService';

/**
 * Subscribes to team members who report to this lead
 */
export function subscribeTeamMembers(
  leadUid: string,
  callback: (members: UserProfile[]) => void,
  onError?: (err: Error) => void
) {
  if (!leadUid) return () => {};

  const q = query(usersCol, where('reportsTo', '==', leadUid));

  return onSnapshot(
    q,
    (snap) => {
      const members = snap.docs
        .map((d) => d.data() as UserProfile)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(members);
    },
    (err) => {
      console.warn('Error subscribing to team members:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Gets all users who report to this lead (one-time fetch)
 */
export async function getTeamMembers(leadUid: string): Promise<UserProfile[]> {
  const q = query(usersCol, where('reportsTo', '==', leadUid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Validates that an employee is in the lead's reporting chain (direct report)
 */
export async function isDirectReport(leadUid: string, employeeUid: string): Promise<boolean> {
  const members = await getTeamMembers(leadUid);
  return members.some((m) => m.uid === employeeUid);
}

/**
 * Subscribes to tasks assigned by this team lead
 */
export function subscribeLeadTasks(
  leadUid: string,
  callback: (tasks: Task[]) => void,
  onError?: (err: Error) => void
) {
  if (!leadUid) return () => {};

  const q = query(tasksCol, where('assignedBy', '==', leadUid));

  return onSnapshot(
    q,
    (snap) => {
      const tasks: Task[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo].filter(Boolean),
        } as Task;
      });

      tasks.sort((a, b) => {
        const aT = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const bT = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return bT - aT;
      });

      callback(tasks);
    },
    (err) => {
      console.warn('Error subscribing to lead tasks:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Assigns a task as a team lead — validates assignee is a direct report
 * Returns error string if validation fails
 */
export async function assignTaskAsLead(
  input: CreateTaskInput & { leadUid: string }
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  // Validate all assignees are direct reports
  const teamMembers = await getTeamMembers(input.leadUid);
  const teamUids = new Set(teamMembers.map((m) => m.uid));

  const invalidAssignees = input.assignedTo.filter((uid) => !teamUids.has(uid));
  if (invalidAssignees.length > 0) {
    return {
      success: false,
      error: 'You can only assign tasks to your direct team members.',
    };
  }

  const taskId = await createTask(input);
  return { success: true, taskId };
}

/**
 * Builds an upward hierarchy chain for an employee (adjacency list traversal)
 * Returns chain from employee → their manager → manager's manager...
 */
export async function getHierarchyChain(
  uid: string,
  maxDepth: number = 10
): Promise<UserProfile[]> {
  const chain: UserProfile[] = [];
  const visited = new Set<string>();

  let currentUid: string | undefined = uid;

  while (currentUid && !visited.has(currentUid) && chain.length < maxDepth) {
    visited.add(currentUid);
    // Use doc() directly by UID instead of a query — no index needed
    const snap = await getDoc(doc(db, 'users', currentUid));
    if (!snap.exists()) break;

    const profile = snap.data() as UserProfile;
    chain.push(profile);
    currentUid = profile.reportsTo;
  }

  return chain;
}

/**
 * Builds a downward reporting tree for a lead
 * Returns { lead, directReports: [{ member, directReports: [] }] }
 */
export interface HierarchyNode {
  profile: UserProfile;
  directReports: HierarchyNode[];
}

export async function getReportingTree(leadUid: string, depth: number = 3): Promise<HierarchyNode | null> {
  if (depth === 0) return null;

  // Direct doc lookup by UID — no query, no index needed
  const snap = await getDoc(doc(db, 'users', leadUid));
  if (!snap.exists()) return null;

  const profile = snap.data() as UserProfile;
  const members = await getTeamMembers(leadUid);

  const directReports: HierarchyNode[] = [];
  for (const member of members) {
    const subNode = await getReportingTree(member.uid, depth - 1);
    if (subNode) directReports.push(subNode);
  }

  return { profile, directReports };
}
