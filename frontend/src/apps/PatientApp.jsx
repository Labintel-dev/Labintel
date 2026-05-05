import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '../components/common/RouteGuards';
import PatientLogin from '../pages/patient/Login';
import PatientRegister from '../pages/patient/Register';
import PatientDashboard from '../pages/patient/Dashboard';
import PatientReportView from '../pages/patient/ReportView';
import PatientTrends from '../pages/patient/Trends';
import PatientProfile from '../pages/patient/Profile';
import GoogleCallback from '../pages/patient/GoogleCallback';
import LinkPhone from '../pages/patient/LinkPhone';
import Landing from '../pages/Landing';

export default function PatientApp() {
  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<PatientLogin />} />
      <Route path="/register" element={<PatientRegister />} />
      <Route path="/auth/callback" element={<GoogleCallback />} />
      <Route path="/dashboard" element={<RequireAuth><PatientDashboard /></RequireAuth>} />
      <Route path="/reports/:id" element={<RequireAuth><PatientReportView /></RequireAuth>} />
      <Route path="/trends"   element={<RequireAuth><PatientTrends /></RequireAuth>} />
      <Route path="/profile"  element={<RequireAuth><PatientProfile /></RequireAuth>} />
      <Route path="/link-phone" element={<RequireAuth><LinkPhone /></RequireAuth>} />
      <Route path="*"         element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
