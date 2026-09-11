import {
  getFirestore,
  collection,
  doc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from './config';

export const db = getFirestore(app);

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  ACTIVITY_LOGS: 'activityLogs',
  NOTIFICATIONS: 'notifications',
} as const;

// Typed collection references
export const usersCol = collection(db, COLLECTIONS.USERS);
export const tasksCol = collection(db, COLLECTIONS.TASKS);
export const activityLogsCol = collection(db, COLLECTIONS.ACTIVITY_LOGS);
export const notificationsCol = collection(db, COLLECTIONS.NOTIFICATIONS);

export { Timestamp, serverTimestamp, doc, collection };
