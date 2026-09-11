# AeroTask — Enterprise Task Management SaaS

A modern, high-performance internal task management web application designed for engineering, marketing, and cross-functional teams. Inspired by the speed and minimalism of Linear and ClickUp, **AeroTask** features end-to-end task tracking, role-based access control (RBAC), team workload distribution, real-time updates, and data-driven performance analytics.

**Architecture Note:** AeroTask uses **no custom backend, no Express, no Node API server, and no external database**. Firebase (Authentication + Cloud Firestore + Firestore Security Rules) provides the entire backend infrastructure.

---

## Features

- **Linear-Style Minimalist UI**: Clean typography, subtle hairline borders, responsive desktop tables, mobile-friendly cards, skeleton loaders, and accessible toast notifications.
- **Firebase Authentication**: Work email + password authentication with password reset links and session persistence.
- **Role-Based Access Control (RBAC)**:
  - Strict system roles: `admin` and `user`.
  - Normal registration strictly defaults to `systemRole: "user"`.
  - Privilege escalation is prevented at the database level via Cloud Firestore Security Rules.
- **Automatic Team Onboarding**: On first sign-in, users select their department:
  - `Backend Engineer`
  - `Frontend Engineer`
  - `Social Media Handler`
  - `Research Team`
  - `Marketing Team`
  - `AIML Team`
  - `Learner`
- **End-to-End Task Lifecycle**:
  - Priorities: `low`, `medium`, `high`, `urgent`.
  - Statuses: `todo`, `in_progress`, `completed`, and task reopening.
  - Multi-state deadline indicators: Upcoming, Due Today, Due Tomorrow, Due Soon, Overdue, Completed On Time, Completed Late.
- **Live Performance Analytics (Recharts)**:
  - Computed on real task timestamps (no fake numbers).
  - Metrics: Total Tasks, Completed, Pending, Overdue, Completion Rate %, On-Time Delivery Rate %, Average Turnaround Time.
  - Time range filters: 7 days, 30 days, 90 days.
  - Charts: Task Velocity Trend (Line), Status Distribution (Donut), Schedule Reliability (Donut), Status Volume (Bar), Team Throughput Comparison (Bar).
- **Admin Command Room**:
  - Global task directory with multi-filtering (Department, Member, Status, Priority, Deadline).
  - Team member roster with drill-down into individual task histories and metrics.
  - Department workload comparisons across all 7 teams.
  - Direct task assignment and reassignment.
- **In-App Real-Time Notifications**:
  - Automated alerts when tasks are assigned, completed, or approaching deadlines.
  - Real-time listener (`onSnapshot`) with unread badge and quick navigation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool & Bundler** | Vite |
| **Styling** | Tailwind CSS + PostCSS + Autoprefixer |
| **Routing** | React Router v7 |
| **Charts & Visualizations**| Recharts |
| **Icons** | Lucide React |
| **Date Utilities** | Date-fns |
| **Backend & Database** | Firebase Authentication + Cloud Firestore |
| **Database Security** | Firestore Security Rules (`firestore.rules`) |

---

## Project Structure

```
AeroTask/
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration (gitignored)
├── .gitignore                # Git ignore specification
├── firebase.json             # Firebase CLI configuration & emulators
├── firestore.rules           # Production Firestore security rules
├── package.json              # Project dependencies & scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS theme tokens
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite bundler configuration with @/* aliases
├── scripts/
│   └── bootstrap-admin.js    # Guidance script for promoting initial administrator
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Master router and context providers
│   ├── index.css             # Tailwind base layers and styling tokens
│   ├── firebase/
│   │   ├── config.ts         # Firebase App initialization & validation
│   │   ├── auth.ts           # Firebase Auth methods & error handlers
│   │   └── firestore.ts      # Cloud Firestore instance & collection references
│   ├── types/
│   │   ├── user.ts           # UserProfile, TeamType, SystemRole
│   │   ├── task.ts           # Task, TaskPriority, TaskStatus, ActivityLog
│   │   └── notification.ts   # AppNotification interface
│   ├── services/
│   │   ├── userService.ts    # User CRUD, role updates, and listeners
│   │   ├── taskService.ts    # Task CRUD, status progression, activity logging
│   │   ├── notificationService.ts # Real-time notification streams
│   │   └── analyticsService.ts    # Pure mathematical metric calculation
│   ├── context/
│   │   ├── AuthContext.tsx   # Auth state, session, and role detection
│   │   ├── ToastContext.tsx  # Sleek toast notification system
│   │   └── NotificationContext.tsx # In-app notification listener
│   ├── hooks/
│   │   ├── useAuth.ts        # Access active user, role, and logout
│   │   ├── useTasks.ts       # Real-time user tasks with filtering
│   │   ├── useAdminTasks.ts  # Real-time global tasks with multi-filter
│   │   ├── useUsers.ts       # Member directory real-time hook
│   │   └── usePerformance.ts # Memoized analytics and charts calculations
│   ├── components/
│   │   ├── ui/               # Button, Input, Textarea, Select, Badge, Modal, ConfirmDialog, Skeleton, EmptyState
│   │   ├── layout/           # AppLayout, Sidebar, Navbar
│   │   ├── tasks/            # TaskTable, TaskCard, TaskModal, DeadlineBadge
│   │   ├── charts/           # PerformanceCharts (Line, Bar, Donut)
│   │   └── notifications/    # NotificationBell popover
│   ├── pages/
│   │   ├── auth/             # Login, Register, ForgotPassword, Onboarding
│   │   ├── user/             # Dashboard, MyTasks, TaskDetail, Profile, Analytics
│   │   └── admin/            # AdminDashboard, AdminUsers, AdminUserDetail, AdminTasks, AdminTeams, AdminAnalytics, AdminSettings
│   └── routes/
│       ├── ProtectedRoute.tsx # Route guard for logged-in users + onboarding
│       └── AdminRoute.tsx     # Route guard for administrators
```

---

## Quick Start & Installation

### 1. Prerequisites
- **Node.js**: Version `18+` or `20+` (Verified on Node `v22.x`)
- **npm**: Version `9+` or `10+`

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-org/aerotask.git
cd AeroTask
npm install
```

---

## Firebase Setup

### Step 1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and enter a name (e.g. `aerotask-prod`).
3. (Optional) Disable Google Analytics or link your analytics account, then click **Create Project**.

### Step 2: Enable Firebase Authentication
1. In your project dashboard, click **Build** &rarr; **Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, select **Email/Password**.
4. Enable **Email/Password** and click **Save**. (Leave Email link / passwordless disabled).

### Step 3: Create Cloud Firestore Database
1. In the left navigation, click **Build** &rarr; **Firestore Database**.
2. Click **Create database**.
3. Choose a Firestore location closest to your users (e.g., `nam5 (us-central)` or `asia-south1`).
4. Select **Start in production mode** (our security rules will protect the collections).

### Step 4: Register Web App & Obtain Credentials
1. Click the **Settings** gear icon &rarr; **Project settings**.
2. Scroll to the **Your apps** section and click the **Web icon (`</>`)**.
3. App nickname: `AeroTask Web`. Click **Register app**.
4. Copy the `firebaseConfig` object values.

---

## Environment Variables Configuration

1. Create a local `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Populate the keys with your actual Firebase web app configuration:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=aerotask-prod.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=aerotask-prod
   VITE_FIREBASE_STORAGE_BUCKET=aerotask-prod.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```
> [!NOTE]
> `.env` is included in `.gitignore` to prevent committing sensitive keys.

---

## Cloud Firestore Security Rules Deployment

AeroTask enforces rigorous database rules to guarantee zero unauthorized access and prevent client-side role manipulation.

### Deploying via Firebase CLI:
1. Install the Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and select your Firebase project:
   ```bash
   firebase login
   firebase use --add
   ```
3. Deploy the rules file directly:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Alternatively, deploy via Firebase Console:
1. In Firebase Console, navigate to **Firestore Database** &rarr; **Rules** tab.
2. Copy the full contents of [`firestore.rules`](./firestore.rules) and paste them into the editor.
3. Click **Publish**.

---

## Initial Administrator Provisioning

In compliance with enterprise security specifications, **there is no public registration option for administrators**. All accounts registered through the web app receive `systemRole = "user"`.

### Recommended Method: Firebase Console
1. Open the application locally or in production and register a new account (e.g. `admin@company.com`).
2. Complete the onboarding step (select department).
3. Open the [Firebase Console](https://console.firebase.google.com) &rarr; **Firestore Database**.
4. Click on the `users` collection.
5. Select the document corresponding to your registered user's UID.
6. Locate the `systemRole` field:
   - Change value from `"user"` to `"admin"`.
7. Click **Save**.
8. Refresh AeroTask. The **Administration** console will immediately unlock in the sidebar navigation!

---

## Development & Production Commands

### Run Locally (Development Dev Server)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Type Check with TypeScript
```bash
npx tsc --noEmit
```

### Build for Production
```bash
npm run build
```
The optimized static production assets will be built into the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## Performance & Calculation Logic

All analytics in AeroTask are computed in pure TypeScript utility functions located in `src/services/analyticsService.ts`:
- **On Time**: `completedAt <= deadline`
- **Late**: `completedAt > deadline`
- **Overdue**: `currentTime > deadline && status !== 'completed'`
- **Pending**: `status === 'todo'`
- **In Progress**: `status === 'in_progress'`
- **Completion Rate**: `(completedTasks / totalTasks) * 100`
- **On-Time Rate**: `(onTimeCompletedTasks / completedTasks) * 100`
- **Average Turnaround Time**: Calculated as the mean duration between `createdAt` and `completedAt`.

---

## License

This project is licensed under the MIT License.
