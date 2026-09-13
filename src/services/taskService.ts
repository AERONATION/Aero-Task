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
import { Task, TaskPriority, TaskStatus, ActivityAction, ActivityLog, ChecklistItem } from '@/types/task';
import { createNotification } from './notificationService';
import { getUserProfile } from './userService';
import { sendTaskAssignedEmail, sendTaskReminderEmail } from './emailService';
import { UserProfile } from '@/types/user';

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
  checklist?: ChecklistItem[];  // Array of API / Todo test items
}

/**
 * Sanitizes checklist items so Firestore never receives `undefined`
 */
export function sanitizeChecklist(items?: ChecklistItem[]): ChecklistItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item, idx) => ({
    id: item.id || `chk_${idx}_${String(item.title || item.endpoint || 'item').replace(/[^a-zA-Z0-9_]/g, '')}`,
    title: String(item.title || item.endpoint || (item as any).name || 'Todo Item').trim(),
    method: String(item.method || 'GET').trim().toUpperCase(),
    endpoint: String(item.endpoint || '').trim(),
    description: String(item.description || '').trim(),
    completed: Boolean(item.completed || (item as any).done || (item as any).status === 'completed'),
    completedBy: item.completedBy || null,
    completedByName: item.completedByName || null,
    completedAt: item.completedAt || null,
  }));
}

export function normalizeTaskData(docId: string, data: any): Task {
  const assignedTo = Array.isArray(data.assignedTo)
    ? data.assignedTo
    : data.assignedTo
    ? [data.assignedTo]
    : [];
  return {
    id: docId,
    ...data,
    assignedTo,
    checklist: sanitizeChecklist(data.checklist),
  };
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
    const cleanMeta: Record<string, any> = {};
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        if (v !== undefined) cleanMeta[k] = v;
      }
    }
    await addDoc(activityLogsCol, {
      userId: userId || 'system',
      taskId: taskId || '',
      action,
      timestamp: serverTimestamp(),
      metadata: cleanMeta,
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

  const assignedTo = Array.isArray(input.assignedTo)
    ? input.assignedTo.filter(Boolean)
    : input.assignedTo
    ? [input.assignedTo]
    : [];

  const cleanedChecklist = sanitizeChecklist(input.checklist);

  const taskData = {
    title: (input.title || '').trim(),
    description: (input.description || '').trim(),
    createdBy: input.createdBy || '',
    assignedTo: assignedTo.length > 0 ? assignedTo : [input.createdBy],
    assignedBy: input.assignedBy || null,
    team: input.team || null,
    priority: input.priority || 'medium',
    status: 'todo' as TaskStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deadline: deadlineTimestamp,
    completedAt: null,
    startedAt: null,
    checklist: cleanedChecklist,
  };

  const docRef = await addDoc(tasksCol, taskData);
  const taskId = docRef.id;

  // Log creation activity
  await logActivity(input.createdBy, taskId, 'task_created', {
    taskTitle: taskData.title,
    assignedTo: taskData.assignedTo,
    checklistCount: cleanedChecklist.length,
  });

  // Notify all assignees (skip creator themselves)
  for (const uid of taskData.assignedTo) {
    if (uid && uid !== input.createdBy) {
      await createNotification(
        uid,
        'task_assigned',
        'New Task Assigned',
        `You were assigned: "${taskData.title}" by ${input.creatorName || 'a teammate'}`,
        taskId
      );
    }
  }

  // Trigger email notifications for assignees asynchronously
  (async () => {
    try {
      const assigneesToEmail = taskData.assignedTo.filter((uid) => uid && uid !== input.createdBy);
      // If task is assigned only to creator, still email if desired or skip
      const targetUids = assigneesToEmail.length > 0 ? assigneesToEmail : taskData.assignedTo.filter(Boolean);
      if (targetUids.length > 0) {
        const profiles = await Promise.all(targetUids.map((uid) => getUserProfile(uid)));
        const validProfiles = profiles.filter(Boolean) as UserProfile[];
        if (validProfiles.length > 0) {
          await sendTaskAssignedEmail({
            task: {
              id: taskId,
              title: taskData.title,
              description: taskData.description,
              priority: taskData.priority,
              deadline: taskData.deadline,
              team: taskData.team,
              checklist: taskData.checklist,
            },
            assignees: validProfiles,
            assignerName: input.creatorName || 'A teammate',
          });
        }
      }
    } catch (mailErr) {
      console.warn('Failed to send task assignment email:', mailErr);
    }
  })();

  return taskId;
}

/**
 * Toggles or updates a single checklist item in a task
 */
export async function toggleTaskChecklistItem(
  taskId: string,
  itemId: string,
  completed: boolean,
  actorUid: string,
  actorName: string
): Promise<ChecklistItem[]> {
  const taskRef = doc(db, 'tasks', taskId);
  const snap = await getDoc(taskRef);
  if (!snap.exists()) throw new Error('Task not found');

  const taskData = snap.data();
  const currentChecklist: ChecklistItem[] = sanitizeChecklist(taskData.checklist);

  let toggledTitle = '';
  const updatedChecklist = currentChecklist.map((item, idx) => {
    const isTarget =
      item.id === itemId ||
      `chk_${idx}` === itemId ||
      `chk_${idx}_${String(item.title || item.endpoint || 'item').replace(/[^a-zA-Z0-9_]/g, '')}` === itemId ||
      item.title === itemId;

    if (isTarget) {
      toggledTitle = item.title;
      return {
        ...item,
        completed,
        completedBy: completed ? actorUid : null,
        completedByName: completed ? actorName : null,
        completedAt: completed ? new Date().toISOString() : null,
      };
    }
    return item;
  });

  await updateDoc(taskRef, {
    checklist: updatedChecklist,
    updatedAt: serverTimestamp(),
  });

  const completedCount = updatedChecklist.filter((i) => i.completed).length;

  await logActivity(actorUid, taskId, 'checklist_item_toggled', {
    itemId,
    itemTitle: toggledTitle || itemId,
    completed,
    actorName,
    progress: `${completedCount}/${updatedChecklist.length}`,
  });

  return updatedChecklist;
}

/**
 * Updates full checklist array for a task
 */
export async function updateTaskChecklist(
  taskId: string,
  checklist: ChecklistItem[],
  actorUid: string,
  actorName: string
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  const cleanedChecklist = sanitizeChecklist(checklist);

  await updateDoc(taskRef, {
    checklist: cleanedChecklist,
    updatedAt: serverTimestamp(),
  });

  await logActivity(actorUid, taskId, 'checklist_updated', {
    totalItems: cleanedChecklist.length,
    completedItems: cleanedChecklist.filter((i) => i.completed).length,
    actorName,
  });
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
    updatedAt: serverTimestamp(),
  };

  if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
  if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
  if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
  if (updates.status !== undefined) cleanUpdates.status = updates.status;
  if (updates.team !== undefined) cleanUpdates.team = updates.team || null;
  if (updates.assignedBy !== undefined) cleanUpdates.assignedBy = updates.assignedBy || null;

  if (updates.deadline !== undefined) {
    cleanUpdates.deadline =
      updates.deadline instanceof Timestamp
        ? updates.deadline
        : Timestamp.fromDate(new Date(updates.deadline));
  }

  if (updates.assignedTo !== undefined) {
    cleanUpdates.assignedTo = Array.isArray(updates.assignedTo)
      ? updates.assignedTo.filter(Boolean)
      : [updates.assignedTo].filter(Boolean);
  }

  if (updates.checklist !== undefined) {
    cleanUpdates.checklist = sanitizeChecklist(updates.checklist);
  }

  await updateDoc(taskRef, cleanUpdates);

  await logActivity(actorUid, taskId, 'task_updated', {
    updatedBy: actorName,
    changes: Object.keys(cleanUpdates),
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
 * Assigns or reassigns task to users
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
  return normalizeTaskData(snap.id, snap.data());
}

/**
 * Subscribes to a single task by ID in real-time
 */
export function subscribeTaskById(
  taskId: string,
  callback: (task: Task | null) => void,
  onError?: (err: Error) => void
) {
  if (!taskId) return () => {};
  const taskRef = doc(db, 'tasks', taskId);
  return onSnapshot(
    taskRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback(normalizeTaskData(snap.id, snap.data()));
      }
    },
    (err) => {
      console.warn('Error subscribing to task doc:', err);
      if (onError) onError(err);
    }
  );
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

  const assignedTasksMap = new Map<string, Task>();
  const createdTasksMap = new Map<string, Task>();
  const legacyTasksMap = new Map<string, Task>();

  const emitCombined = () => {
    const allMap = new Map<string, Task>();
    legacyTasksMap.forEach((v, k) => allMap.set(k, v));
    createdTasksMap.forEach((v, k) => allMap.set(k, v));
    assignedTasksMap.forEach((v, k) => allMap.set(k, v));

    const tasks = Array.from(allMap.values());
    tasks.sort((a, b) => {
      const aTime = a.deadline?.seconds ? a.deadline.seconds * 1000 : new Date(a.deadline || 0).getTime();
      const bTime = b.deadline?.seconds ? b.deadline.seconds * 1000 : new Date(b.deadline || 0).getTime();
      return aTime - bTime;
    });

    callback(tasks);
  };

  // 1. Array contains (all multiple assignees)
  const qArray = query(tasksCol, where('assignedTo', 'array-contains', userId));
  const unsubArray = onSnapshot(
    qArray,
    (snap) => {
      assignedTasksMap.clear();
      snap.docs.forEach((d) => assignedTasksMap.set(d.id, normalizeTaskData(d.id, d.data())));
      emitCombined();
    },
    (err) => {
      console.warn('Error in qArray subscription:', err);
      if (onError) onError(err);
    }
  );

  // 2. Created by user (so creators always see tasks they assigned to others)
  const qCreated = query(tasksCol, where('createdBy', '==', userId));
  const unsubCreated = onSnapshot(
    qCreated,
    (snap) => {
      createdTasksMap.clear();
      snap.docs.forEach((d) => createdTasksMap.set(d.id, normalizeTaskData(d.id, d.data())));
      emitCombined();
    },
    (err) => {
      console.warn('Error in qCreated subscription:', err);
    }
  );

  // 3. Legacy string assignedTo format fallback
  const qLegacy = query(tasksCol, where('assignedTo', '==', userId));
  const unsubLegacy = onSnapshot(
    qLegacy,
    (snap) => {
      legacyTasksMap.clear();
      snap.docs.forEach((d) => legacyTasksMap.set(d.id, normalizeTaskData(d.id, d.data())));
      emitCombined();
    },
    () => {}
  );

  return () => {
    unsubArray();
    unsubCreated();
    unsubLegacy();
  };
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
      const tasks: Task[] = snap.docs.map((d) => normalizeTaskData(d.id, d.data()));

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

/**
 * Manually sends an email and in-app reminder to assignees of a task
 */
export async function sendTaskReminder(
  taskId: string,
  senderUid: string,
  senderName: string,
  reminderNote?: string
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    const snap = await getDoc(taskRef);
    if (!snap.exists()) {
      return { success: false, sentCount: 0, error: 'Task not found' };
    }

    const task = normalizeTaskData(snap.id, snap.data());
    const assigneeUids = task.assignedTo.filter((uid) => uid && uid !== senderUid);
    const targetUids = assigneeUids.length > 0 ? assigneeUids : task.assignedTo.filter(Boolean);

    if (targetUids.length === 0) {
      return { success: false, sentCount: 0, error: 'No assignees found to remind for this task' };
    }

    const profiles = await Promise.all(targetUids.map((uid) => getUserProfile(uid)));
    const validProfiles = profiles.filter(Boolean) as UserProfile[];

    if (validProfiles.length === 0) {
      return { success: false, sentCount: 0, error: 'Assignee profile emails not found' };
    }

    // Send email via Resend
    const emailResult = await sendTaskReminderEmail({
      task,
      assignees: validProfiles,
      senderName,
      reminderNote,
    });

    // Send In-App Notifications
    for (const uid of targetUids) {
      await createNotification(
        uid,
        'task_reminder',
        `Task Reminder: ${task.title}`,
        reminderNote
          ? `${senderName} sent a reminder: "${reminderNote}"`
          : `${senderName} reminded you about the pending task "${task.title}"`,
        taskId
      );
    }

    // Update task with lastRemindedAt timestamp
    await updateDoc(taskRef, {
      lastRemindedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Log the reminder in activity history
    await logActivity(senderUid, taskId, 'reminder_sent', {
      senderName,
      recipientCount: validProfiles.length,
      reminderNote: reminderNote || '',
    });

    return {
      success: emailResult.success || true,
      sentCount: validProfiles.length,
      error: emailResult.errors?.[0],
    };
  } catch (err: any) {
    console.error('Failed to send task reminder:', err);
    return { success: false, sentCount: 0, error: err.message || 'Failed to send reminder' };
  }
}

