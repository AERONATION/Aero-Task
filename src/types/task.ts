import { Timestamp } from 'firebase/firestore';
import { TeamType } from './user';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface ChecklistItem {
  id: string;
  title: string;
  method?: string;          // e.g. 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint?: string;        // e.g. '/api/v1/users'
  description?: string;
  completed: boolean;
  completedBy?: string;     // UID of user who marked it complete
  completedByName?: string; // Display name
  completedAt?: Timestamp | string | null | any;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  assignedTo: string[];         // Array of assignee UIDs (admin can assign multiple)
  assignedBy?: string | null;
  team?: TeamType;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  deadline: Timestamp | any;
  completedAt?: Timestamp | null | any;
  startedAt?: Timestamp | null | any;
  checklist?: ChecklistItem[];  // Array of API / Todo test items
}

export type ActivityAction =
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_updated'
  | 'task_reopened'
  | 'task_assigned'
  | 'checklist_updated'
  | 'checklist_item_toggled';

export interface ActivityLog {
  id: string;
  userId: string;
  taskId: string;
  action: ActivityAction;
  timestamp: Timestamp | any;
  metadata?: Record<string, any>;
  userName?: string;
  taskTitle?: string;
}

export interface TaskFilterOptions {
  search?: string;
  team?: string;
  assignedTo?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  sortBy?: 'deadline' | 'createdAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}
