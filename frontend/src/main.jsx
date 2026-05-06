import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LabApp from './apps/LabApp';
import Landing from './pages/Landing';
import LandingPage from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import { PatientPortal, DoctorPortal } from './pages/Dashboards';
import ReportsPage from './pages/ReportsPage';
import { AboutUsPage, TermsPage, RefundPolicyPage } from './pages/PolicyPages';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from './components/common';
import OAuthCallback from './pages/OAuthCallback';
import AdminApp from './pages/admin/AdminApp';
import './index.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('App render failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded-xl border border-red-100 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold text-slate-800">Page could not load</h1>
            <p className="mt-2 text-sm text-slate-500">
              Refresh the page. If it still happens, log out and sign in again.
            </p>
            <button
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LabAppWrapper() {
  const { slug } = useParams();
  return <LabApp slug={slug} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/lab/:slug/*" element={<LabAppWrapper />} />
              <Route path="/patient" element={<PatientPortal />} />
              <Route path="/select-role" element={<RoleSelectPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="/doctor" element={<DoctorPortal />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
            </Routes>
            <ToastContainer />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
