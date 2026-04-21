# LabIntel Super Admin Panel 🧬📊

![LabIntel Banner](https://via.placeholder.com/1200x300/0a0e17/06b6d4?text=LabIntel+Super+Admin+Panel)

A highly advanced, dark-themed **Super Admin Dashboard** designed specifically for managing large-scale diagnostic laboratories, teams, session activities, and system logs. Built with a modern tech stack to ensure high performance, security, and scalability.

## 🚀 Key Features

*   **Real-Time Dashboard Overview**: Instantly view critical metrics such as the total number of active labs, processed patients, generated reports, and system alerts.
*   **Live Active Sessions Monitoring**: Dynamic progress bars and live counters that display concurrent active users across multiple diagnostic lab subdomains in real-time.
*   **Comprehensive Lab Management**: Dedicated cards to manage individual lab operations. Change statuses (Active, Trial, Inactive), view associated metrics, and perform administrative actions (Activate, Deactivate, Edit settings, Remove).
*   **Chronological Activity Feed**: An interactive, color-coded feed that logs all system events (success, warnings, errors, infos) to maintain a complete audit trail.
*   **Team & Access Management**: A detailed tabular view of all registered team members, their assigned roles, lab affiliations, operational statuses, and performance metrics (e.g., reports generated).
*   **Dynamic Search & Filtering**: Robust search capabilities across all tables and cards, enabling quick location of specific labs or team members.
*   **Premium Dark Theme UI**: A custom-designed, aesthetic dark mode utilizing glassmorphism, smooth micro-animations, and vibrant gradients (cyan, teal, purple) to ensure a stunning user experience.

---

## 🛠 Technology Stack

### Frontend Architecture
*   **Framework**: React 18
*   **Build Tool**: Vite (Lightning fast HMR and optimized builds)
*   **Routing**: React Router DOM v7
*   **Styling**: Pure Vanilla CSS (`index.css`) with a strictly enforced Design System
*   **Icons**: Lucide React

### Backend Architecture
*   **Runtime**: Node.js (v18+)
*   **Framework**: Express.js
*   **Middleware**: CORS, Custom Error Handlers
*   **API Design**: RESTful standard with JSON payloads

### Database & Authentication
*   **Provider**: Supabase
*   **Database**: PostgreSQL
*   **ORM / Client**: `@supabase/supabase-js`

---

## 📁 Project Structure

```text
Labintel/
├── server/                     # 🚀 Backend Express Server
│   ├── db/
│   │   ├── schema.sql          # SQL Schema for Supabase Tables & RLS Policies
│   │   ├── seed.js             # Automated Database Seeding Script
│   │   └── supabase.js         # Supabase Client Configuration
│   ├── index.js                # Primary Express Application & API Routes
│   ├── package.json            # Backend Dependencies
│   └── .env                    # Environment Variables (DB Credentials)
│
├── src/                        # 💻 Frontend React Application
│   ├── components/             # Reusable UI Elements
│   │   ├── Sidebar.jsx         # Global Navigation
│   │   ├── LabCard.jsx         # Individual Lab Management Card
│   │   ├── StatsCards.jsx      # Top-level metric cards
│   │   ├── ActivityFeed.jsx    # System event logging UI
│   │   ├── LiveSessions.jsx    # Real-time concurrent user tracking UI
│   │   └── TeamTable.jsx       # Staff directory table
│   ├── pages/                  # Route Components
│   │   ├── Dashboard.jsx       # Main landing overview
│   │   ├── AllLabs.jsx         # Lab directory and management
│   │   ├── TeamMembers.jsx     # Staff management page
│   │   ├── ReportsLogs.jsx     # Detailed system and operational logs
│   │   ├── Settings.jsx        # Admin preferences and configurations
│   │   └── ActivityLog.jsx     # Full-page system audit trail
│   ├── hooks/                  # Custom React Hooks
│   ├── data/                   # Fallback / Mock State Data
│   ├── App.jsx                 # Application Root & Router Configuration
│   ├── main.jsx                # React DOM Render Entry
│   └── index.css               # Global Stylesheet & Theme Tokens
│
├── package.json                # Frontend Dependencies
└── vite.config.js              # Vite Build Configuration
```

---

## ⚙️ Setup & Installation Guide

### Prerequisites
*   Node.js (v18.x or newer)
*   NPM or Yarn package manager
*   A newly created [Supabase](https://supabase.com/) Project

### 1. Database Provisioning (Supabase)
1. Log into your Supabase dashboard and select your project.
2. Navigate to the **SQL Editor** on the left sidebar.
3. Open `server/db/schema.sql` from this repository.
4. Copy the contents and execute the query. This will:
   *   Create the `labs`, `team_members`, `activity_logs`, and `sessions` tables.
   *   Establish primary/foreign key relationships.
   *   Enable Row Level Security (RLS) and default access policies.

### 2. Backend Initialization
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd server
   ```
2. Install necessary node modules:
   ```bash
   npm install
   ```
3. Create a `.env` file at `server/.env` and inject your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=5000
   ```
4. **(Optional)** Seed the database with initial mock data:
   ```bash
   npm run seed
   ```
5. Launch the backend API server:
   ```bash
   npm run dev
   ```
   *The server will start listening on `http://localhost:5000`.*

### 3. Frontend Initialization
1. Open a separate terminal and ensure you are in the project root:
   ```bash
   cd ..
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will launch on `http://localhost:5173`. Open this URL in your browser.*

---

## 🔗 RESTful API Endpoints

The Express backend routes all requests through the `/api` prefix.

### Dashboard & Analytics
*   `GET /api/stats` - Fetches high-level aggregated numbers for the dashboard cards.
*   `GET /api/sessions` - Retrieves the active user counts across subdomains.

### Lab Management
*   `GET /api/labs` - Lists all registered labs.
*   `POST /api/labs` - Registers a new lab entity.
*   `PUT /api/labs/:id` - Modifies an existing lab's details or status.
*   `DELETE /api/labs/:id` - Removes a lab from the system.

### Team Management
*   `GET /api/team` - Lists all staff and administrative members.
*   `POST /api/team` - Provisions a new team member.
*   `PUT /api/team/:id` - Updates team member roles or operational status.

### Audit & Logging
*   `GET /api/activity` - Fetches the chronological system event logs.

---

## 🎨 UI & Design System Specifications

The application relies on a handcrafted, variable-driven CSS design system (`index.css`) designed to exude a premium feel:

*   **Background Hierarchy**: Utilizing deep navy and grays (`#0a0e17`, `#111827`, `#1a1f2e`) to reduce eye strain and provide contrast.
*   **Vibrant Accents**: Strategic use of Cyan (`#06b6d4`), Teal (`#14b8a6`), Purple (`#8b5cf6`), and Pink (`#ec4899`) for metrics, progress bars, and alerts.
*   **Glassmorphism**: Semi-transparent panels with subtle borders (`rgba(255, 255, 255, 0.05)`) and backdrop blurs to create depth.
*   **Typography**: Using `Inter` or standard system fonts with specific font-weight handling for data readability.
*   **Micro-interactions**: Hover scaling (`scale(1.02)`), opacity transitions, and continuous pulse animations for live indicators.
