import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'task_assigned' | 'deadline_soon' | 'task_completed' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: Timestamp | any;
}
