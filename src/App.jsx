import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AllLabs from './pages/AllLabs';
import LiveUsers from './pages/LiveUsers';
import TeamMembers from './pages/TeamMembers';
import ReportsLogs from './pages/ReportsLogs';
import ActivityLog from './pages/ActivityLog';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('labintel_auth');
    return !!auth;
  });

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('labintel_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/labs" element={<AllLabs />} />
          <Route path="/live-users" element={<LiveUsers />} />
          <Route path="/team" element={<TeamMembers />} />
          <Route path="/reports" element={<ReportsLogs />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
