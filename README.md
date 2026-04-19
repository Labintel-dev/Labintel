# 🧪 LabIntel Hub: Patient & Database Core (Supabase) Somsubhra Bhaskar

This part of the **AI Diagnostic Lab Manager** project, developed by **Somsubhra**, handles the robust backend infrastructure, real-time data persistence, and secure authentication using **Supabase**. It serves as the "brain" for patient data management and diagnostic report synchronization.

## 🚀 Key Features

*   **Secure Authentication**: Integrated with Supabase Auth for multi-role user management (Patient).
*   **Real-time Synchronization**: Live updates for diagnostic report statuses using supabesh.
*   **Unified Patient Profiles**: Centralized schema for medical profiles, including PII (Personally Identifiable Information) management.
*   **Automated Notifications**: Event-driven SMTP triggers for Welcome emails and "Report Ready" alerts.
*   **Scalable Architecture**: Decoupled client-server logic with a high-performance database layer.

---

## 📂 Database Architecture

The system utilizes a relational PostgreSQL schema hosted on Supabase. Below are the primary entities:

### 1. `patient` Table
Stores comprehensive user profiles linked directly to Supabase Authentication.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key (references `auth.users.id`) |
| `full_name` | `TEXT` | User's full display name |
| `email` | `TEXT` | Primary contact email |
| `phone` | `TEXT` | Contact number for notifications |
| `dob` | `DATE` | Date of Birth |
| `role` | `TEXT` | System role: `patient`, `staff`, `doctor`, `admin` |

### 2. `reports` Table
Manages diagnostic reports and AI-generated analysis.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique report identifier |
| `patient_id` | `UUID` | Foreign Key to `patient.id` |
| `status` | `TEXT` | Status lifecycle: `pending` → `processing` → `ready` |
| `data` | `JSONB` | Structured diagnostic results (Biomarkers, Values) |
| `summary` | `TEXT` | AI-generated clinical insights |
| `created_at` | `TIMESTAMPTZ` | Auto-generated timestamp |

---

## 🛠️ Integration Layer (`supabase.js`)

The `client/src/lib/supabase.js` file provides a high-level API for interacting with the database.

### Auth Helpers
- `signIn(email, password)`: Authenticates user and initiates session.
- `signUp(email, password, options)`: Registers new users with custom metadata.
- `signOut()`: Terminates the active session.

### Data Helpers
- `getProfile(userId)`: Fetches the patient profile.
- `upsertProfile(userId, profileData)`: Synchronizes client-side profile updates to the DB.
- `getReports(patientId)`: Retrieves all diagnostic history for a specific patient.
- `subscribeToReports(patientId, callback)`: Establishes a real-time WebSocket connection to listen for report updates.

---

## 📧 Server-Side Enhancements

The Node.js server acts as an intelligent middleware to handle complex side-effects that exceed simple CRUD:

1.  **Welcome Sequence**: Triggered upon first profile completion.
2.  **Report Readiness Notification**: Automatically sends an email via SMTP when a lab technician or AI agent marks a report as `ready`.
3.  **Health Monitoring**: `/health` endpoint validates Supabase connectivity and RLS (Row Level Security) compliance.

---

## ⚙️ Setup & Environment

To connect to this part of the project, ensure the following environment variables are configured:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Server-side Admin Config
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

---

*This module provides the foundational data integrity and security required for modern digital healthcare applications.*
