import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, RequireRole } from '../components/common/RouteGuards';
import RoleSelect from '../pages/lab/RoleSelect';
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
import StaffManagement from '../pages/lab/StaffManagement';
import TestPanels from '../pages/lab/TestPanels';
import LabSettings from '../pages/lab/LabSettings';
import StaffTracking from '../pages/lab/StaffTracking';

const ADMIN = ['administrator', 'manager'];
const ALL   = ['administrator', 'manager', 'receptionist', 'technician'];

export default function LabApp({ slug }) {
  return (
    <Routes>
      {/* Role selection page — shown first */}
      <Route path="/login" element={<RoleSelect slug={slug} />} />

      {/* Role-specific login — after selecting a role */}
      <Route path="/login/:role" element={<LabLogin slug={slug} />} />

      <Route path="/dashboard" element={<RequireAuth><LabDashboard /></RequireAuth>} />

      <Route path="/patients"     element={<RequireAuth><Patients /></RequireAuth>} />
      <Route path="/patients/new" element={<RequireAuth><Patients /></RequireAuth>} />
      <Route path="/patients/:id" element={<RequireAuth><PatientDetail /></RequireAuth>} />

      <Route path="/reports"      element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/reports/new"  element={
        <RequireAuth><RequireRole roles={['administrator','manager','technician']}><NewReport /></RequireRole></RequireAuth>
      } />
      <Route path="/reports/:id"  element={<RequireAuth><ReportDetail /></RequireAuth>} />

      <Route path="/analytics" element={
        <RequireAuth><RequireRole roles={ADMIN}><Analytics /></RequireRole></RequireAuth>
      } />
      <Route path="/alerts" element={
        <RequireAuth><RequireRole roles={ADMIN}><Alerts /></RequireRole></RequireAuth>
      } />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

      {/* Manager-only pages */}
      <Route path="/staff" element={
        <RequireAuth><RequireRole roles={ADMIN}><StaffManagement /></RequireRole></RequireAuth>
      } />
      <Route path="/staff-tracking" element={
        <RequireAuth><RequireRole roles={ADMIN}><StaffTracking /></RequireRole></RequireAuth>
      } />
      <Route path="/test-panels" element={
        <RequireAuth><RequireRole roles={ADMIN}><TestPanels /></RequireRole></RequireAuth>
      } />
      <Route path="/lab-settings" element={
        <RequireAuth><RequireRole roles={ADMIN}><LabSettings /></RequireRole></RequireAuth>
      } />

      {/* Release report — redirect to reports filtered by in_review */}
      <Route path="/release" element={
        <RequireAuth><RequireRole roles={ADMIN}><Reports defaultStatus="in_review" /></RequireRole></RequireAuth>
      } />

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
