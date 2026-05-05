<p align="center">
  <img src="https://img.shields.io/badge/LabIntel-Smart%20Diagnostics-0d9488?style=for-the-badge&logo=flask&logoColor=white" alt="LabIntel Badge" />
</p>

<h1 align="center">≡ƒº¬ LabIntel ΓÇö Smart Diagnostic Lab Management System</h1>

<p align="center">
  A modern, full-stack Laboratory Information Management System (LIMS) built for diagnostic labs to manage patients, reports, staff, and analytics ΓÇö all from a beautifully designed web interface.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
</p>

---

## ≡ƒôï Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Role-Based Access](#-role-based-access)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## Γ£¿ Features

### ≡ƒÅÑ Staff Portal (Lab-side)
- **Role-Based Login** ΓÇö Separate portals for Receptionist, Technician, and Manager with role-specific dashboards
- **Patient Management** ΓÇö Register patients, view history, track visits
- **Report Management** ΓÇö Create, edit, and release diagnostic reports with test parameters
- **Test Panels** ΓÇö Configurable test panels with parameters, reference ranges, and pricing
- **Analytics Dashboard** ΓÇö Daily report volume, panel mix charts, turnaround time tracking
- **Health Alerts** ΓÇö Critical value alerts, worsening trends, persistent abnormal detection
- **Staff Management** ΓÇö Invite staff, assign roles, activate/deactivate accounts
- **Lab Settings** ΓÇö Customize lab branding (logo, colors), manage test panels
- **PDF Report Generation** ΓÇö Auto-generated professional PDF reports with lab branding
- **AI-Powered Insights** ΓÇö Google Gemini integration for intelligent report summaries

### ≡ƒæñ Patient Portal
- **Report Access** ΓÇö Patients can view their diagnostic reports securely
- **AI Health Summaries** ΓÇö Plain-language explanations of lab results
- **Report Download** ΓÇö Download PDF copies of reports

### ≡ƒÄ¿ Design & UX
- **Modern UI** ΓÇö Glassmorphism, smooth animations, gradient accents
- **Responsive Design** ΓÇö Works across desktop, tablet, and mobile
- **White-Label Support** ΓÇö Each lab gets custom branding (colors, logo, slug-based URLs)
- **Dark/Light Accents** ΓÇö Role-specific color theming throughout the portal

---

## ≡ƒ¢á Tech Stack

| Layer        | Technology                                                    |
|-------------|---------------------------------------------------------------|
| **Frontend** | React 18, Vite 5, TailwindCSS 3.4, Framer Motion            |
| **State**    | Zustand, React Query (TanStack Query v5)                     |
| **Forms**    | React Hook Form + Zod validation                             |
| **UI**       | Radix UI primitives, Lucide icons, Recharts                  |
| **Backend**  | Node.js, Express 4                                           |
| **Database** | Supabase (PostgreSQL) with Row Level Security                |
| **Auth**     | JWT-based authentication with bcrypt password hashing        |
| **AI**       | Google Gemini API for health insights                        |
| **PDF**      | Puppeteer for server-side PDF generation                     |
| **SMS**      | Fast2SMS integration for OTP delivery                        |
| **Deploy**   | Vercel (frontend) + Render (backend)                         |

---

## ≡ƒôü Project Structure

```
labintel/
Γö£ΓöÇΓöÇ frontend/                  # React + Vite frontend
Γöé   Γö£ΓöÇΓöÇ src/
Γöé   Γöé   Γö£ΓöÇΓöÇ apps/              # App entry points (LabApp, PatientApp)
Γöé   Γöé   Γö£ΓöÇΓöÇ components/        # Reusable UI components
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ common/        # Buttons, Inputs, Modals, RouteGuards
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ lab/           # Lab-specific layout (LabLayout)
Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ patient/       # Patient-specific components
Γöé   Γöé   Γö£ΓöÇΓöÇ hooks/             # Custom hooks (useAuth, useLabPath, useLabContext)
Γöé   Γöé   Γö£ΓöÇΓöÇ pages/             # Page components
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ lab/           # Staff portal pages
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ RoleSelect.jsx   # Role selection (3-card portal)
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Login.jsx        # Role-specific login form
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Dashboard.jsx    # Staff dashboard with KPIs
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Patients.jsx     # Patient list & registration
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Reports.jsx      # Report list & management
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ NewReport.jsx    # Create new diagnostic report
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Analytics.jsx    # Charts & analytics (Manager)
Γöé   Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Settings.jsx     # Lab profile, panels, staff
Γöé   Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ Alerts.jsx       # Health alerts dashboard
Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ patient/       # Patient portal pages
Γöé   Γöé   Γö£ΓöÇΓöÇ services/          # API service layers (axios)
Γöé   Γöé   Γö£ΓöÇΓöÇ store/             # Zustand stores (auth, UI)
Γöé   Γöé   ΓööΓöÇΓöÇ utils/             # Utility functions (cn, formatDate)
Γöé   Γö£ΓöÇΓöÇ index.html
Γöé   Γö£ΓöÇΓöÇ tailwind.config.js
Γöé   ΓööΓöÇΓöÇ vite.config.js
Γöé
Γö£ΓöÇΓöÇ backend/                   # Node.js + Express API
Γöé   Γö£ΓöÇΓöÇ controllers/           # Route handlers
Γöé   Γö£ΓöÇΓöÇ routes/                # Express route definitions
Γöé   Γöé   Γö£ΓöÇΓöÇ auth.js            # Staff & patient authentication
Γöé   Γöé   Γö£ΓöÇΓöÇ patients.js        # Patient CRUD + alerts
Γöé   Γöé   Γö£ΓöÇΓöÇ reports.js         # Report CRUD + PDF generation
Γöé   Γöé   Γö£ΓöÇΓöÇ analytics.js       # Dashboard analytics
Γöé   Γöé   Γö£ΓöÇΓöÇ settings.js        # Lab settings, panels, staff
Γöé   Γöé   Γö£ΓöÇΓöÇ dashboard.js       # Staff dashboard KPIs
Γöé   Γöé   ΓööΓöÇΓöÇ patientPortal.js   # Patient-facing endpoints
Γöé   Γö£ΓöÇΓöÇ middleware/            # Auth middleware, error handling
Γöé   Γö£ΓöÇΓöÇ services/             # Business logic services
Γöé   Γö£ΓöÇΓöÇ schemas/              # Zod validation schemas
Γöé   Γö£ΓöÇΓöÇ db/                   # Database migrations & seeds
Γöé   Γö£ΓöÇΓöÇ templates/            # PDF report HTML templates
Γöé   Γö£ΓöÇΓöÇ jobs/                 # Cron jobs (alert generation)
Γöé   Γö£ΓöÇΓöÇ server.js             # Express app entry point
Γöé   ΓööΓöÇΓöÇ .env.example          # Environment variable template
Γöé
ΓööΓöÇΓöÇ README.md
```

---

## ≡ƒÜÇ Getting Started

### Prerequisites

- **Node.js** ΓëÑ 18.x
- **npm** ΓëÑ 9.x
- **Supabase** account (free tier works)
- **Google Gemini API** key (optional, for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/Labintel-dev/Labintel.git
cd Labintel
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials and API keys
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate
npm run seed          # Seed demo lab data
```

### 5. Start Development Servers

**Backend** (runs on port 3001):
```bash
cd backend
npm run dev
```

**Frontend** (runs on port 5173):
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173/lab/testlab/login](http://localhost:5173/lab/testlab/login) to access the staff portal.

---

## ≡ƒöÉ Environment Variables

### Backend (`backend/.env`)

| Variable              | Description                           | Required |
|-----------------------|---------------------------------------|----------|
| `PORT`                | Server port (default: 3001)           | Yes      |
| `SUPABASE_URL`        | Supabase project URL                  | Yes      |
| `SUPABASE_SERVICE_KEY`| Supabase service role key             | Yes      |
| `SUPABASE_ANON_KEY`   | Supabase anon/public key              | Yes      |
| `DATABASE_URL`        | Direct Postgres connection string     | Yes      |
| `JWT_SECRET`          | Secret for JWT token signing          | Yes      |
| `GEMINI_API_KEY`      | Google Gemini API key                 | No       |
| `FAST2SMS_API_KEY`    | Fast2SMS API key for OTP              | No       |
| `FRONTEND_URL`        | Frontend URL for CORS                 | Yes      |
| `PDF_STORAGE_BUCKET`  | Supabase storage bucket name          | Yes      |

### Frontend (`frontend/.env`)

| Variable        | Description                  | Required |
|-----------------|------------------------------|----------|
| `VITE_API_URL`  | Backend API base URL         | Yes      |

---

## ≡ƒô£ Available Scripts

### Backend

| Command                  | Description                        |
|--------------------------|------------------------------------|
| `npm run dev`            | Start dev server with nodemon      |
| `npm start`              | Start production server            |
| `npm run migrate`        | Run database migrations            |
| `npm run seed`           | Seed demo data                     |
| `npm run seed:enterprise`| Seed enterprise/multi-lab data     |
| `npm test`               | Run tests with Vitest              |

### Frontend

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start Vite dev server          |
| `npm run build`   | Build for production           |
| `npm run preview` | Preview production build       |

---

## ≡ƒæÑ Role-Based Access

LabIntel uses a role-based access control system with three staff roles:

| Role             | Access Level                                                     |
|------------------|------------------------------------------------------------------|
| **Receptionist** | Register patients, view reports, release reports, download PDFs  |
| **Technician**   | Create/edit reports, enter test values, download PDFs            |
| **Manager**      | Full access ΓÇö analytics, settings, staff management, approvals   |

### Login Flow
1. Navigate to `/lab/{lab-slug}/login`
2. Select your role (Receptionist / Technician / Manager)
3. Enter your work email and password
4. Redirected to role-appropriate dashboard

---

## ≡ƒöî API Endpoints

### Authentication
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/v1/auth/staff/login`  | Staff login              |
| GET    | `/api/v1/auth/lab/:slug`    | Get lab by slug          |
| POST   | `/api/v1/auth/patient/otp`  | Send patient OTP         |
| POST   | `/api/v1/auth/patient/verify`| Verify patient OTP      |

### Patients
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | `/api/v1/patients`               | List patients            |
| POST   | `/api/v1/patients`               | Register patient         |
| GET    | `/api/v1/patients/:id`           | Get patient details      |
| GET    | `/api/v1/patients/:id/alerts`    | Get patient alerts       |

### Reports
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | `/api/v1/reports`                | List reports             |
| POST   | `/api/v1/reports`                | Create report            |
| GET    | `/api/v1/reports/:id`            | Get report details       |
| PUT    | `/api/v1/reports/:id`            | Update report            |
| GET    | `/api/v1/reports/:id/pdf`        | Download report PDF      |

### Analytics & Settings
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | `/api/v1/analytics/dashboard`    | Dashboard KPIs           |
| GET    | `/api/v1/analytics/volume`       | Report volume data       |
| GET    | `/api/v1/settings/lab`           | Get lab settings         |
| PUT    | `/api/v1/settings/lab`           | Update lab settings      |
| GET    | `/api/v1/settings/panels`        | List test panels         |
| POST   | `/api/v1/settings/panels`        | Create test panel        |

---

## ≡ƒÜó Deployment

### Frontend ΓÇö Vercel
1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL` = your backend URL
4. Deploy

### Backend ΓÇö Render
1. Connect your GitHub repository to Render
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`
6. Deploy

---

## ≡ƒñ¥ Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ≡ƒôä License

This project is proprietary software developed by **LabIntel Technologies**.

---

<p align="center">
  Built with Γ¥ñ∩╕Å by the LabIntel Team
</p>
