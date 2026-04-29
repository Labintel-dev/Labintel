import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage    from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import { PatientPortal, LabPortal, AdminPortal, DoctorPortal } from './pages/Dashboards';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"              element={<LandingPage />}    />
        <Route path="/select-role"   element={<RoleSelectPage />} />
        <Route path="/patient"       element={<PatientPortal />}  />
        <Route path="/lab"           element={<LabPortal />}      />
        <Route path="/admin"         element={<AdminPortal />}    />
        <Route path="/doctor"        element={<DoctorPortal />}   />
      </Routes>
    </Router>
  );
}

export default App;