import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '../components/common/RouteGuards';
import { useAuthStore } from '../store/authStore';
import PatientLogin from '../pages/patient/Login';
import PatientDashboard from '../pages/patient/Dashboard';
import PatientReportView from '../pages/patient/ReportView';
import PatientTrends from '../pages/patient/Trends';
import PatientProfile from '../pages/patient/Profile';
import GoogleCallback from '../pages/patient/GoogleCallback';
import Landing from '../pages/Landing';

export default function PatientApp() {
  const { clearAuth, isOtpSession } = useAuthStore();

  useEffect(() => {
    // Logout OTP sessions on back button
    const handlePopState = () => {
      if (isOtpSession) {
        clearAuth();
      }
    };

    // Logout OTP sessions on page refresh
    const handleBeforeUnload = () => {
      if (isOtpSession) {
        clearAuth();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOtpSession, clearAuth]);

  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<PatientLogin />} />
      <Route path="/auth/callback" element={<GoogleCallback />} />
      <Route path="/dashboard" element={<RequireAuth><PatientDashboard /></RequireAuth>} />
      <Route path="/reports/:id" element={<RequireAuth><PatientReportView /></RequireAuth>} />
      <Route path="/trends"   element={<RequireAuth><PatientTrends /></RequireAuth>} />
      <Route path="/profile"  element={<RequireAuth><PatientProfile /></RequireAuth>} />
      <Route path="*"         element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
