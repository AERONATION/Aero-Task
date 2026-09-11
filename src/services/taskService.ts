import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, tasksCol, activityLogsCol } from '@/firebase/firestore';
import { Task, TaskPriority, TaskStatus, ActivityAction, ActivityLog } from '@/types/task';
import { createNotification } from './notificationService';

export interface CreateTaskInput {
  title: string;
  description: string;
  createdBy: string;
  assignedTo: string[];         // Multiple assignees
  assignedBy?: string | null;
  team?: any;
  priority: TaskPriority;
  deadline: Date | Timestamp;
  creatorName?: string;
  assigneeNames?: string[];
}

/**
 * Creates an activity log entry
 */
export async function logActivity(
  userId: string,
  taskId: string,
  action: ActivityAction,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await addDoc(activityLogsCol, {
      userId,
      taskId,
      action,
      timestamp: serverTimestamp(),
      metadata: metadata || {},
    });
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}

/**
 * Creates a new task and logs the creation
 */
export async function createTask(input: CreateTaskInput): Promise<string> {
  const deadlineTimestamp =
    input.deadline instanceof Timestamp ? input.deadline : Timestamp.fromDate(new Date(input.deadline));

  const assignedTo = Array.isArray(input.assignedTo) ? input.assignedTo : [input.assignedTo];

  const taskData = {
    title: input.title.trim(),
    description: input.description.trim(),
    createdBy: input.createdBy,
    assignedTo,
    assignedBy: input.assignedBy || null,
    team: input.team || null,
    priority: input.priority,
    status: 'todo' as TaskStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deadline: deadlineTimestamp,
    completedAt: null,
    startedAt: null,
  };

  const docRef = await addDoc(tasksCol, taskData);
  const taskId = docRef.id;

  // Log creation activity
  await logActivity(input.createdBy, taskId, 'task_created', {
    taskTitle: input.title,
    assignedTo,
  });

  // Notify all assignees (skip creator themselves)
  for (const uid of assignedTo) {
    if (uid && uid !== input.createdBy) {
      await createNotification(
        uid,
        'task_assigned',
        'New Task Assigned',
        `You were assigned: "${input.title}" by ${input.creatorName || 'a teammate'}`,
        taskId
      );
    }
  }

  return taskId;
}

/**
 * Updates an existing task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt' | 'createdBy'>>,
  actorUid: string,
  actorName: string
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);

  const cleanUpdates: Record<string, any> = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (updates.deadline) {
    cleanUpdates.deadline =
      updates.deadline instanceof Timestamp
        ? updates.deadline
        : Timestamp.fromDate(new Date(updates.deadline));
  }

  await updateDoc(taskRef, cleanUpdates);

  await logActivity(actorUid, taskId, 'task_updated', {
    updatedBy: actorName,
    changes: Object.keys(updates),
  });
}

/**
 * Updates task status (todo -> in_progress -> completed, or reopen)
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  currentTask: Task,
  actorUid: string,
  actorName: string
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  const updates: Record<string, any> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };

  let action: ActivityAction = 'task_updated';

  if (newStatus === 'in_progress') {
    action = 'task_started';
    if (!currentTask.startedAt) {
      updates.startedAt = serverTimestamp();
    }
  } else if (newStatus === 'completed') {
    action = 'task_completed';
    updates.completedAt = serverTimestamp();

    // Notify assigner if assigned by an admin/teammate
    if (currentTask.assignedBy && currentTask.assignedBy !== actorUid) {
      await createNotification(
        currentTask.assignedBy,
        'task_completed',
        'Task Completed',
        `"${currentTask.title}" was marked as completed by ${actorName}`,
        taskId
      );
    }
  } else if (newStatus === 'todo' && currentTask.status === 'completed') {
    action = 'task_reopened';
    updates.completedAt = null;
  }

  await updateDoc(taskRef, updates);
  await logActivity(actorUid, taskId, action, {
    taskTitle: currentTask.title,
    actorName,
  });
}

/**
 * Assigns or reassigns task to a user
 */
export async function assignTask(
  taskId: string,
  newAssigneeUids: string[],
  team: any,
  adminUid: string,
  adminName: string,
  taskTitle: string
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);

  await updateDoc(taskRef, {
    assignedTo: newAssigneeUids,
    assignedBy: adminUid,
    team: team || null,
    updatedAt: serverTimestamp(),
  });

  await logActivity(adminUid, taskId, 'task_assigned', {
    assignedTo: newAssigneeUids,
    assignedBy: adminName,
    taskTitle,
  });

  // Notify all new assignees
  for (const uid of newAssigneeUids) {
    await createNotification(
      uid,
      'task_assigned',
      'Task Reassigned',
      `You have been assigned the task: "${taskTitle}" by ${adminName}`,
      taskId
    );
  }
}

/**
 * Deletes a task
 */
export async function deleteTask(taskId: string, actorUid: string, taskTitle: string): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);

  await logActivity(actorUid, taskId, 'task_updated', {
    deleted: true,
    taskTitle,
  });
}

/**
 * Fetches a single task by ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  if (!taskId) return null;
  const taskRef = doc(db, 'tasks', taskId);
  const snap = await getDoc(taskRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Task, 'id'>) };
}

/**
 * Subscribes to tasks assigned to or created by a user
 */
export function subscribeUserTasks(
  userId: string,
  callback: (tasks: Task[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};

  // Subscribe to tasks where user is in the assignedTo array
  const q = query(tasksCol, where('assignedTo', 'array-contains', userId));

  return onSnapshot(
    q,
    (snap) => {
      const tasks: Task[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Task, 'id'>),
      }));

      // Sort client-side by deadline ascending
      tasks.sort((a, b) => {
        const aTime = a.deadline?.seconds ? a.deadline.seconds * 1000 : new Date(a.deadline || 0).getTime();
        const bTime = b.deadline?.seconds ? b.deadline.seconds * 1000 : new Date(b.deadline || 0).getTime();
        return aTime - bTime;
      });

      callback(tasks);
    },
    (err) => {
      console.error('Error in user tasks subscription:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to all tasks (for admin view)
 */
export function subscribeAllTasks(
  callback: (tasks: Task[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    tasksCol,
    (snap) => {
      const tasks: Task[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Task, 'id'>),
      }));

      // Sort client-side by createdAt descending
      tasks.sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      callback(tasks);
    },
    (err) => {
      console.error('Error in all tasks subscription:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to activity logs for a specific task
 */
export function subscribeTaskLogs(
  taskId: string,
  callback: (logs: ActivityLog[]) => void
) {
  if (!taskId) return () => {};

  const q = query(
    activityLogsCol,
    where('taskId', '==', taskId),
    limit(25)
  );

  return onSnapshot(
    q,
    (snap) => {
      const logs: ActivityLog[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ActivityLog, 'id'>),
      }));

      logs.sort((a, b) => {
        const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      });

      callback(logs);
    },
    (err) => {
      console.error('Error subscribing to task logs:', err);
    }
  );
}

/**
 * Subscribes to recent activity logs across the platform
 */
export function subscribeRecentActivity(
  callback: (logs: ActivityLog[]) => void,
  limitCount: number = 20
) {
  const q = query(activityLogsCol, limit(limitCount));

  return onSnapshot(
    q,
    (snap) => {
      const logs: ActivityLog[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ActivityLog, 'id'>),
      }));

      logs.sort((a, b) => {
        const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      });

      callback(logs);
    },
    (err) => {
      console.error('Error subscribing to recent activity:', err);
    }
  );
}
