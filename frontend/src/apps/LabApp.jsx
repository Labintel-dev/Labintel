import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, RequireRole } from '../components/common/RouteGuards';
import LabLogin from '../pages/lab/Login';
import LabDashboard from '../pages/lab/Dashboard';
import Patients from '../pages/lab/Patients';
import PatientDetail from '../pages/lab/PatientDetail';
import Reports from '../pages/lab/Reports';
import NewReport from '../pages/lab/NewReport';
import ReportDetail from '../pages/lab/ReportDetail';
import Analytics from '../pages/lab/Analytics';
import Alerts from '../pages/lab/Alerts';
import Settings from '../pages/lab/Settings';

const ADMIN = ['administrator'];
const ALL   = ['administrator', 'receptionist', 'technician'];

export default function LabApp({ slug }) {
  return (
    <Routes>
      <Route path="/login" element={<LabLogin slug={slug} />} />

      <Route path="/dashboard" element={<RequireAuth><LabDashboard /></RequireAuth>} />

      <Route path="/patients"     element={<RequireAuth><Patients /></RequireAuth>} />
      <Route path="/patients/new" element={<RequireAuth><Patients /></RequireAuth>} />
      <Route path="/patients/:id" element={<RequireAuth><PatientDetail /></RequireAuth>} />

      <Route path="/reports"      element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/reports/new"  element={
        <RequireAuth><RequireRole roles={['administrator','technician']}><NewReport /></RequireRole></RequireAuth>
      } />
      <Route path="/reports/:id"  element={<RequireAuth><ReportDetail /></RequireAuth>} />

      <Route path="/analytics" element={
        <RequireAuth><RequireRole roles={ADMIN}><Analytics /></RequireRole></RequireAuth>
      } />
      <Route path="/alerts" element={
        <RequireAuth><RequireRole roles={ADMIN}><Alerts /></RequireRole></RequireAuth>
      } />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
