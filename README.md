# LabIntel Super Admin Panel

A comprehensive, dark-themed Super Admin dashboard for managing diagnostic labs, team members, reports, and activity logs. Built with React (Vite) for the frontend, Express.js for the backend API, and Supabase (PostgreSQL) for the database.

## 🚀 Features

- **Dashboard Overview**: Key metrics including active labs, total patients, reports, and alerts.
- **Live Active Sessions**: Real-time progress bars showing concurrent active users across different diagnostic labs.
- **Lab Management**: Comprehensive cards for managing lab status (Active, Trial, Inactive) with associated actions (Activate, Deactivate, Edit, Remove).
- **Activity Feed**: Chronological log of system events with colored status indicators and lab highlighting.
- **Team Management**: Detailed table view of all team members, their roles, assigned labs, status, and performance metrics.
- **Dynamic Filtering**: Search and filter functionality across the 'All Labs' page.
- **Dark Theme UI**: Custom-built, sleek dark mode design system with glassmorphism, gradient accents, and responsive layouts.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Lucide React (Icons), Vanilla CSS
- **Backend**: Node.js, Express.js, CORS
- **Database / Auth**: Supabase, PostgreSQL, @supabase/supabase-js

## 📁 Project Structure

```
Labintel/
├── server/                     # Express.js Backend API
│   ├── db/
│   │   ├── schema.sql          # Supabase SQL Schema
│   │   ├── seed.js             # Data seeding script
│   │   ├── setup.js            # Automated setup script
│   │   └── supabase.js         # Supabase client initialization
│   ├── index.js                # Express Server Entry Point
│   ├── package.json
│   └── .env                    # Supabase Environment Variables
│
├── src/                        # React Frontend
│   ├── components/             # Reusable UI components (Sidebar, Cards, Tables)
│   ├── data/                   # Fallback mock data
│   ├── hooks/                  # Custom React Hooks (useApi, useDashboardData)
│   ├── pages/                  # Route Pages (Dashboard, AllLabs, TeamMembers, etc.)
│   ├── App.jsx                 # Main Layout & Router
│   ├── main.jsx                # React Entry Point
│   └── index.css               # Global Design System & Dark Theme
│
├── package.json                # Frontend Dependencies
└── vite.config.js              # Vite Configuration
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- A Supabase Project

### 1. Database Setup (Supabase)
1. Go to your Supabase Project Dashboard
2. Navigate to the **SQL Editor**
3. Copy the contents of `server/db/schema.sql` and run it to create the required tables and security policies.

### 2. Backend Setup
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PORT=5000
   ```
4. Seed the database with demo data:
   ```bash
   npm run seed
   ```
5. Start the Express API server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5000`*

### 3. Frontend Setup
1. Open a new terminal and navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`*

## 🔗 API Endpoints

The Express server exposes the following endpoints (prefixed with `/api`):

- `GET /stats` - Aggregated dashboard statistics
- `GET /labs` - Retrieve all labs
- `POST /labs` - Create a new lab
- `PUT /labs/:id` - Update a lab
- `DELETE /labs/:id` - Delete a lab
- `GET /team` - Retrieve all team members
- `POST /team` - Add a team member
- `PUT /team/:id` - Update a team member
- `GET /activity` - Retrieve recent activity logs
- `GET /sessions` - Retrieve live session data

## 🎨 Design System

The application utilizes a custom CSS design system located in `index.css`. It features:
- Core dark backgrounds: `#0a0e17`, `#111827`, `#1a1f2e`
- Vibrant Accents: Cyan (`#06b6d4`), Teal (`#14b8a6`), Purple (`#8b5cf6`), Pink (`#ec4899`)
- Micro-animations: Smooth transitions on hover states and pulse animations for live indicators.
