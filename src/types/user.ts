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

export type EmploymentType = 'Full-time' | 'Part-time' | 'Intern' | 'Contractor' | 'Freelancer';

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full-time',
  'Part-time',
  'Intern',
  'Contractor',
  'Freelancer',
];

export type ExperienceLevel = 'Junior' | 'Mid-level' | 'Senior' | 'Lead' | 'Manager' | 'Director';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Junior',
  'Mid-level',
  'Senior',
  'Lead',
  'Manager',
  'Director',
];

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  systemRole: SystemRole;

  // Professional Info
  team?: TeamType;
  designation?: string;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  department?: string;
  employeeId?: string;

  // Personal Info
  phone?: string;
  location?: string;
  timezone?: string;
  bio?: string;
  skills?: string[];

  // Social & Contact
  socialLinks?: SocialLinks;

  // Emergency / Company Contact
  emergencyContact?: string;

  // Status
  isActive: boolean;
  createdAt: Timestamp | string | number | any;
  updatedAt: Timestamp | string | number | any;
  lastLoginAt?: Timestamp | string | number | any;
}
