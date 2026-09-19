import { Timestamp } from 'firebase/firestore';

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half-day';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;               // "YYYY-MM-DD" string for easy dedup query
  status: AttendanceStatus;
  markedBy: string;           // Team lead UID who marked it
  markedByName?: string;
  department?: string;
  notes?: string;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

export interface AttendanceInput {
  employeeId: string;
  employeeName?: string;
  date: string;               // "YYYY-MM-DD"
  status: AttendanceStatus;
  markedBy: string;
  markedByName?: string;
  department?: string;
  notes?: string;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  leave: 'On Leave',
  'half-day': 'Half Day',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'emerald',
  absent: 'rose',
  leave: 'amber',
  'half-day': 'blue',
};
