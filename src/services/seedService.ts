import {
  collection,
  doc,
  setDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, tasksCol, usersCol, activityLogsCol, notificationsCol } from '@/firebase/firestore';
import { UserProfile } from '@/types/user';

export async function seedFirestoreData(currentUid: string, currentName: string = 'Admin User') {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Seed Sample Users (All 7 teams represented)
  const sampleUsers = [
    {
      uid: "user_backend_01",
      name: "David Chen",
      email: "david.chen@aerotask.internal",
      photoURL: "",
      systemRole: "user" as const,
      team: "Backend Engineer" as const,
      designation: "Lead Infrastructure Engineer",
      isActive: true,
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      lastLoginAt: Timestamp.fromDate(yesterday),
    },
    {
      uid: "user_frontend_01",
      name: "Elena Rostova",
      email: "elena.rostova@aerotask.internal",
      photoURL: "",
      systemRole: "user" as const,
      team: "Frontend Engineer" as const,
      designation: "Senior UI/UX Architect",
      isActive: true,
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      lastLoginAt: Timestamp.fromDate(now),
    },
    {
      uid: "user_aiml_01",
      name: "Aarav Sharma",
      email: "aarav.sharma@aerotask.internal",
      photoURL: "",
      systemRole: "user" as const,
      team: "AIML Team" as const,
      designation: "ML Research Specialist",
      isActive: true,
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      lastLoginAt: Timestamp.fromDate(twoDaysAgo),
    },
    {
      uid: "user_marketing_01",
      name: "Sarah Jenkins",
      email: "sarah.j@aerotask.internal",
      photoURL: "",
      systemRole: "user" as const,
      team: "Marketing Team" as const,
      designation: "Product Marketing Manager",
      isActive: true,
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      lastLoginAt: Timestamp.fromDate(yesterday),
    },
    {
      uid: "user_social_01",
      name: "Marcus Vance",
      email: "marcus.v@aerotask.internal",
      photoURL: "",
      systemRole: "user" as const,
      team: "Social Media Handler" as const,
      designation: "Content & Brand Strategist",
      isActive: true,
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      lastLoginAt: Timestamp.fromDate(yesterday),
    },
    {
      uid: "user_research_01",
      name: "Dr. Maya Lin",
      email: "maya.lin@aerotask.internal",
      photoURL: "",
      systemRole: "user" as const,
      team: "Research Team" as const,
      designation: "Principal Analyst",
      isActive: true,
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      lastLoginAt: Timestamp.fromDate(now),
    },
    {
      uid: "user_learner_01",
      name: "Leo Garcia",
      email: "leo.g@aerotask.internal",
      photoURL: "",
      systemRole: "user" as const,
      team: "Learner" as const,
      designation: "Software Apprentice",
      isActive: true,
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      lastLoginAt: Timestamp.fromDate(yesterday),
    },
  ];

  for (const u of sampleUsers) {
    try {
      await setDoc(doc(db, "users", u.uid), u);
    } catch (e) {
      console.warn("User doc skip/permission:", e);
    }
  }

  // 2. Seed Sample Tasks (Assigned to current user and teammates)
  const sampleTasks = [
    {
      title: "Set up Continuous Deployment Pipeline",
      description: "Establish GitHub Actions workflow to build, test, and deploy Vite production assets automatically.",
      createdBy: currentUid,
      assignedTo: currentUid,
      assignedBy: null,
      team: "Backend Engineer",
      priority: "high",
      status: "in_progress",
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      startedAt: Timestamp.fromDate(twoDaysAgo),
      completedAt: null,
      deadline: Timestamp.fromDate(tomorrow),
    },
    {
      title: "Design Linear-Style Dark Mode Tokens",
      description: "Refine neutral zinc palettes, subtle hairline borders, and hover micro-animations.",
      createdBy: currentUid,
      assignedTo: currentUid,
      assignedBy: null,
      team: "Frontend Engineer",
      priority: "medium",
      status: "completed",
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(yesterday),
      startedAt: Timestamp.fromDate(twoDaysAgo),
      completedAt: Timestamp.fromDate(yesterday),
      deadline: Timestamp.fromDate(inThreeDays),
    },
    {
      title: "Train Domain Classifier for Ticket Routing",
      description: "Benchmark classification accuracy on internal issue reports using small language model embeddings.",
      createdBy: currentUid,
      assignedTo: "user_aiml_01",
      assignedBy: currentUid,
      team: "AIML Team",
      priority: "urgent",
      status: "in_progress",
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(now),
      startedAt: Timestamp.fromDate(yesterday),
      completedAt: null,
      deadline: Timestamp.fromDate(inSevenDays),
    },
    {
      title: "Publish Monthly Product Roadmap Update",
      description: "Coordinate cross-functional status update with marketing and engineering leads.",
      createdBy: currentUid,
      assignedTo: "user_marketing_01",
      assignedBy: currentUid,
      team: "Marketing Team",
      priority: "medium",
      status: "completed",
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(yesterday),
      startedAt: Timestamp.fromDate(twoDaysAgo),
      completedAt: Timestamp.fromDate(yesterday),
      deadline: Timestamp.fromDate(yesterday),
    },
    {
      title: "Resolve Critical Latency Spike in Cache Layer",
      description: "Investigate eviction spikes under heavy concurrent reads and adjust TTL parameters.",
      createdBy: currentUid,
      assignedTo: currentUid,
      assignedBy: null,
      team: "Backend Engineer",
      priority: "urgent",
      status: "todo",
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(threeDaysAgo),
      startedAt: null,
      completedAt: null,
      deadline: Timestamp.fromDate(yesterday), // OVERDUE
    },
    {
      title: "Draft Developer Onboarding Cheatsheet",
      description: "Create quickstart documentation for new interns and junior engineering apprentice rotations.",
      createdBy: currentUid,
      assignedTo: "user_learner_01",
      assignedBy: currentUid,
      team: "Learner",
      priority: "low",
      status: "completed",
      createdAt: Timestamp.fromDate(threeDaysAgo),
      updatedAt: Timestamp.fromDate(yesterday),
      startedAt: Timestamp.fromDate(twoDaysAgo),
      completedAt: Timestamp.fromDate(yesterday),
      deadline: Timestamp.fromDate(inThreeDays),
    },
    {
      title: "Analyze Cross-Department Bottleneck Metrics",
      description: "Identify velocity impediments between product discovery, engineering, and final delivery.",
      createdBy: currentUid,
      assignedTo: "user_research_01",
      assignedBy: currentUid,
      team: "Research Team",
      priority: "high",
      status: "todo",
      createdAt: Timestamp.fromDate(twoDaysAgo),
      updatedAt: Timestamp.fromDate(twoDaysAgo),
      startedAt: null,
      completedAt: null,
      deadline: Timestamp.fromDate(inThreeDays),
    }
  ];

  for (const t of sampleTasks) {
    const docRef = await addDoc(tasksCol, t);
    
    // Log creation activity
    await addDoc(activityLogsCol, {
      userId: currentUid,
      taskId: docRef.id,
      action: "task_created",
      timestamp: t.createdAt,
      metadata: { taskTitle: t.title, actorName: currentName }
    });
  }

  // 3. Seed Notifications for current user
  await addDoc(notificationsCol, {
    userId: currentUid,
    type: "system",
    title: "Welcome to AeroTask",
    message: "Your internal task management workspace has been successfully connected to Cloud Firestore!",
    taskId: null,
    read: false,
    createdAt: Timestamp.fromDate(now),
  });

  return true;
}
