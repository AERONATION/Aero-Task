import { Timestamp } from 'firebase/firestore';

export type SystemRole = 'admin' | 'user';

export type TeamType =
  | 'Backend Engineer'
  | 'Frontend Engineer'
  | 'Social Media Handler'
  | 'Research Team'
  | 'Marketing Team'
  | 'AIML Team'
  | 'Learner';

export const TEAMS: TeamType[] = [
  'Backend Engineer',
  'Frontend Engineer',
  'Social Media Handler',
  'Research Team',
  'Marketing Team',
  'AIML Team',
  'Learner',
];

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  systemRole: SystemRole;
  team?: TeamType;
  designation?: string;
  isActive: boolean;
  createdAt: Timestamp | string | number | any;
  updatedAt: Timestamp | string | number | any;
  lastLoginAt?: Timestamp | string | number | any;
}
