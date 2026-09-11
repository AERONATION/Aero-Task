import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDmRWGXBvEJWFqhbyDe3hbmrPDDPdtwUz4",
  authDomain: "aerotask-552c6.firebaseapp.com",
  projectId: "aerotask-552c6",
  storageBucket: "aerotask-552c6.firebasestorage.app",
  messagingSenderId: "1025326214063",
  appId: "1:1025326214063:web:32866c8021142cb14ddd5a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Connecting to Cloud Firestore (aerotask-552c6)...");

async function seedDatabase() {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Seed Sample Users Model (Representing all 7 departments)
    console.log("Seeding collection: users...");
    const sampleUsers = [
      {
        uid: "user_backend_01",
        name: "David Chen",
        email: "david.chen@aerotask.internal",
        photoURL: "",
        systemRole: "user",
        team: "Backend Engineer",
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
        systemRole: "user",
        team: "Frontend Engineer",
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
        systemRole: "user",
        team: "AIML Team",
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
        systemRole: "user",
        team: "Marketing Team",
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
        systemRole: "user",
        team: "Social Media Handler",
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
        systemRole: "user",
        team: "Research Team",
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
        systemRole: "user",
        team: "Learner",
        designation: "Software Apprentice",
        isActive: true,
        createdAt: Timestamp.fromDate(threeDaysAgo),
        updatedAt: Timestamp.fromDate(now),
        lastLoginAt: Timestamp.fromDate(yesterday),
      },
      {
        uid: "admin_master_01",
        name: "Ayush Singh (Lead Admin)",
        email: "admin@aerotask.internal",
        photoURL: "",
        systemRole: "admin",
        team: "Backend Engineer",
        designation: "System Administrator & Tech Lead",
        isActive: true,
        createdAt: Timestamp.fromDate(threeDaysAgo),
        updatedAt: Timestamp.fromDate(now),
        lastLoginAt: Timestamp.fromDate(now),
      },
    ];

    for (const u of sampleUsers) {
      await setDoc(doc(db, "users", u.uid), u);
      console.log(`  ✓ Created user model: ${u.name} (${u.team})`);
    }

    // 2. Seed Sample Tasks Model
    console.log("\nSeeding collection: tasks...");
    const sampleTasks = [
      {
        id: "task_arch_01",
        title: "Implement Zero-Trust Token Invalidation",
        description: "Configure distributed session revocation and token fingerprinting across microservices.",
        createdBy: "admin_master_01",
        assignedTo: "user_backend_01",
        assignedBy: "admin_master_01",
        team: "Backend Engineer",
        priority: "urgent",
        status: "in_progress",
        createdAt: Timestamp.fromDate(threeDaysAgo),
        updatedAt: Timestamp.fromDate(now),
        startedAt: Timestamp.fromDate(twoDaysAgo),
        completedAt: null,
        deadline: Timestamp.fromDate(tomorrow),
      },
      {
        id: "task_ui_01",
        title: "Revamp Task Table Keyboard Navigation",
        description: "Introduce Command-K shortcut modal and arrow key row selection for desktop ergonomics.",
        createdBy: "admin_master_01",
        assignedTo: "user_frontend_01",
        assignedBy: "admin_master_01",
        team: "Frontend Engineer",
        priority: "high",
        status: "completed",
        createdAt: Timestamp.fromDate(threeDaysAgo),
        updatedAt: Timestamp.fromDate(yesterday),
        startedAt: Timestamp.fromDate(twoDaysAgo),
        completedAt: Timestamp.fromDate(yesterday), // On time (yesterday < inThreeDays)
        deadline: Timestamp.fromDate(inThreeDays),
      },
      {
        id: "task_ml_01",
        title: "Benchmark LLM Embeddings for Task Deduplication",
        description: "Evaluate vector search accuracy when clustering duplicate user issue submissions.",
        createdBy: "admin_master_01",
        assignedTo: "user_aiml_01",
        assignedBy: "admin_master_01",
        team: "AIML Team",
        priority: "high",
        status: "in_progress",
        createdAt: Timestamp.fromDate(threeDaysAgo),
        updatedAt: Timestamp.fromDate(now),
        startedAt: Timestamp.fromDate(yesterday),
        completedAt: null,
        deadline: Timestamp.fromDate(inSevenDays),
      },
      {
        id: "task_mkt_01",
        title: "Q4 Enterprise Productivity Benchmark Report",
        description: "Compile case studies highlighting velocity improvements from internal task tracking.",
        createdBy: "admin_master_01",
        assignedTo: "user_marketing_01",
        assignedBy: "admin_master_01",
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
        id: "task_soc_01",
        title: "Publish Monthly Engineering Milestone Carousel",
        description: "Highlight recent architecture achievements on LinkedIn and technical developer forums.",
        createdBy: "admin_master_01",
        assignedTo: "user_social_01",
        assignedBy: "admin_master_01",
        team: "Social Media Handler",
        priority: "medium",
        status: "todo",
        createdAt: Timestamp.fromDate(yesterday),
        updatedAt: Timestamp.fromDate(yesterday),
        startedAt: null,
        completedAt: null,
        deadline: Timestamp.fromDate(inThreeDays),
      },
      {
        id: "task_res_01",
        title: "Analyze Cross-Department Bottleneck Metrics",
        description: "Identify common blockers causing overdue deliveries across engineering and marketing.",
        createdBy: "admin_master_01",
        assignedTo: "user_research_01",
        assignedBy: "admin_master_01",
        team: "Research Team",
        priority: "high",
        status: "todo",
        createdAt: Timestamp.fromDate(twoDaysAgo),
        updatedAt: Timestamp.fromDate(twoDaysAgo),
        startedAt: null,
        completedAt: null,
        deadline: Timestamp.fromDate(tomorrow),
      },
      {
        id: "task_lrn_01",
        title: "Complete Firestore Composite Index Modules",
        description: "Review query constraints, shallow collections, and security rules documentation.",
        createdBy: "admin_master_01",
        assignedTo: "user_learner_01",
        assignedBy: "admin_master_01",
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
        id: "task_overdue_01",
        title: "Patch Redis Cluster Sentinel Failover Timeout",
        description: "Adjust quorum threshold and update connection retry backoff parameters.",
        createdBy: "admin_master_01",
        assignedTo: "user_backend_01",
        assignedBy: "admin_master_01",
        team: "Backend Engineer",
        priority: "urgent",
        status: "todo",
        createdAt: Timestamp.fromDate(threeDaysAgo),
        updatedAt: Timestamp.fromDate(threeDaysAgo),
        startedAt: null,
        completedAt: null,
        deadline: Timestamp.fromDate(yesterday), // Passed deadline -> OVERDUE
      }
    ];

    for (const t of sampleTasks) {
      await setDoc(doc(db, "tasks", t.id), t);
      console.log(`  ✓ Created task model: "${t.title}" [${t.status}]`);
    }

    // 3. Seed Activity Logs Model
    console.log("\nSeeding collection: activityLogs...");
    const sampleLogs = [
      {
        userId: "admin_master_01",
        taskId: "task_arch_01",
        action: "task_created",
        timestamp: Timestamp.fromDate(threeDaysAgo),
        metadata: { taskTitle: "Implement Zero-Trust Token Invalidation", assignedTo: "user_backend_01" }
      },
      {
        userId: "user_backend_01",
        taskId: "task_arch_01",
        action: "task_started",
        timestamp: Timestamp.fromDate(twoDaysAgo),
        metadata: { taskTitle: "Implement Zero-Trust Token Invalidation", actorName: "David Chen" }
      },
      {
        userId: "user_frontend_01",
        taskId: "task_ui_01",
        action: "task_completed",
        timestamp: Timestamp.fromDate(yesterday),
        metadata: { taskTitle: "Revamp Task Table Keyboard Navigation", actorName: "Elena Rostova" }
      },
      {
        userId: "admin_master_01",
        taskId: "task_overdue_01",
        action: "task_assigned",
        timestamp: Timestamp.fromDate(threeDaysAgo),
        metadata: { taskTitle: "Patch Redis Cluster Sentinel Failover Timeout", assignedTo: "user_backend_01" }
      }
    ];

    for (const l of sampleLogs) {
      await addDoc(collection(db, "activityLogs"), l);
      console.log(`  ✓ Logged activity: ${l.action} for ${l.metadata.taskTitle}`);
    }

    // 4. Seed Notifications Model
    console.log("\nSeeding collection: notifications...");
    const sampleNotifications = [
      {
        userId: "user_backend_01",
        type: "task_assigned",
        title: "Critical Task Assigned",
        message: 'You have been assigned "Patch Redis Cluster Sentinel Failover Timeout" by Tech Lead',
        taskId: "task_overdue_01",
        read: false,
        createdAt: Timestamp.fromDate(yesterday),
      },
      {
        userId: "user_frontend_01",
        type: "task_completed",
        title: "Milestone Completed",
        message: 'Your deliverable "Revamp Task Table Keyboard Navigation" is resolved',
        taskId: "task_ui_01",
        read: true,
        createdAt: Timestamp.fromDate(yesterday),
      }
    ];

    for (const n of sampleNotifications) {
      await addDoc(collection(db, "notifications"), n);
      console.log(`  ✓ Created notification: "${n.title}"`);
    }

    console.log("\n==================================================");
    console.log("SUCCESS: All Firestore models & sample collections initialized!");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("Firestore seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
