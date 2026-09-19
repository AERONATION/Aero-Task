import { Timestamp } from 'firebase/firestore';

export type RecurringType = 'none' | 'daily' | 'weekly';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledBy: string;         // UID of team lead/admin who created it
  scheduledByName?: string;
  department?: string;         // team/department name
  participants: string[];      // Array of participant UIDs
  participantNames?: string[]; // Display names
  date: Timestamp | any;       // Meeting date
  startTime: string;           // "HH:MM" 24h format
  endTime: string;             // "HH:MM" 24h format
  recurring: RecurringType;
  location?: string;
  notes?: string;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

export interface MeetingInput {
  title: string;
  description?: string;
  scheduledBy: string;
  scheduledByName?: string;
  department?: string;
  participants: string[];
  participantNames?: string[];
  date: Date | Timestamp;
  startTime: string;
  endTime: string;
  recurring: RecurringType;
  location?: string;
  notes?: string;
}
