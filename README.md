# LabIntel Hub

LabIntel Hub is a diagnostic reporting platform with a React frontend and an Express backend. The app includes a marketing landing page, role-based portal routes, report workflows, and Supabase-backed authentication and data access.

## Project Structure

- `client/` - React + Vite frontend
- `server/` - Express API for profile and report endpoints
- `.env` - shared environment values loaded by the backend at runtime

## Features

- Responsive landing page and report preview experience
- Role-based routes for patient, lab, admin, and doctor portals
- Supabase authentication and profile management
- Report listing, creation, and status updates through the backend API
- Health endpoint for local backend verification

## Tech Stack

- Frontend: React, Vite, React Router, Framer Motion
- Backend: Node.js, Express, Nodemon
- Data/Auth: Supabase
- Styling: Tailwind CSS utilities and custom CSS

## Prerequisites

- Node.js 18+ and npm
- A Supabase project if you want the authenticated flows to work fully

## Environment Variables

Create a root `.env` file for shared backend/frontend values:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `client/.env.local` if you want to override the frontend API target locally:

```env
VITE_API_BASE_URL=http://localhost:3002
```

## Installation

From the repository root:

```bash
npm run install:all
```

Or install each package separately:

```bash
npm run install:client
npm run install:server
```

## Running Locally

Start the frontend:

```bash
npm run dev:client
```

Start the backend in a second terminal:

```bash
npm run dev:server
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:3002`
- Health check: `http://localhost:3002/health`

## Available Scripts

From the repository root:

- `npm run dev` - starts the frontend
- `npm run dev:client` - starts the Vite frontend
- `npm run dev:server` - starts the Express backend with Nodemon
- `npm run build` - builds the frontend
- `npm run build:client` - builds the frontend
- `npm run start:server` - runs the backend without Nodemon
- `npm run lint:client` - runs frontend linting
- `npm run install:all` - installs client and server dependencies

## API Overview

Main backend routes:

- `GET /health`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `GET /api/reports`
- `POST /api/reports`
- `PATCH /api/reports/:id/status`

Authenticated routes expect a Supabase bearer token.

## Notes

- The backend loads environment values from the root `.env`, `client/.env.local`, and the current shell environment.
- `client/` is the frontend source of truth.
- The backend entrypoint is `server/server.js`.
