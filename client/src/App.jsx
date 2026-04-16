import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage    from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import { PatientPortal, LabPortal, AdminPortal, DoctorPortal } from './pages/Dashboards';
import ReportsPage from './pages/ReportsPage';
import { AboutUsPage, TermsPage, RefundPolicyPage } from './pages/PolicyPages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"              element={<LandingPage />}    />
        <Route path="/reports"       element={<ReportsPage />}    />
        <Route path="/select-role"   element={<RoleSelectPage />} />
        <Route path="/patient"       element={<PatientPortal />}  />
        <Route path="/lab"           element={<LabPortal />}      />
        <Route path="/admin"         element={<AdminPortal />}    />
        <Route path="/doctor"        element={<DoctorPortal />}   />
        <Route path="/about-us"      element={<AboutUsPage />}    />
        <Route path="/terms"         element={<TermsPage />}      />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
