# LabIntel Hub

LabIntel is a comprehensive healthcare platform featuring a robust monorepo architecture, splitting the frontend and backend into dedicated environments.

## ✨ Key Features

- **Post-Login Portal:** Secure authenticated area equipped with a dedicated user interface.
- **User Navigation Menu:** An intuitive dropdown menu from the top user icon provides quick access to:
  - **Update Profile:** Manage user details.
  - **My Reports:** Direct access to medical documentation.
  - **Logout:** Securely end the session.
- **Report Dashboard:** Users can easily access the "My Reports" section to view and download their lab reports in a streamlined dashboard.
- **OCR Scanning Engine:** Sophisticated optical character recognition (OCR) scanning capabilities for parsing medical documents.
- **Print Portal:** A dedicated section designed to properly format and facilitate the printing of reports.

## 📁 Project Structure

The codebase is organized as follows:
- `client/`: React + Vite frontend application (The single source of truth for the UI).
- `server/`: Express backend application (Backend entrypoint is `server.js`).

## 🚀 Getting Started

From the project root directory, use the following commands to install dependencies and run the application locally.

### Installation

```bash
npm run install:all
```

### Running the Application

Start the client (frontend) development server:
```bash
npm run dev:client
```

Start the server (backend) development server:
```bash
npm run dev:server
```

### Building for Production

Compile the frontend app for production deployment:
```bash
npm run build:client

```bash
npm run build:client
```



- Root-level duplicate frontend files were removed so `client/` is the only frontend source of truth.
- Backend entrypoint: `server/server.js`.
