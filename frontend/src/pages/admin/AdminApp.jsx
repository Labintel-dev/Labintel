import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminAllLabs from './AdminAllLabs';
import AdminLiveUsers from './AdminLiveUsers';
import AdminReportsLogs from './AdminReportsLogs';
import AdminActivityLog from './AdminActivityLog';
import AdminSettings from './AdminSettings';
import AdminSidebar from '../../components/admin/AdminSidebar';
import '../../styles/admin.css';

function AdminLayout({ onLogout }) {
  return (
    <div className="app-layout">
      <AdminSidebar onLogout={onLogout} />
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="labs" element={<AdminAllLabs />} />
        <Route path="live-users" element={<AdminLiveUsers />} />
        <Route path="reports" element={<AdminReportsLogs />} />
        <Route path="activity" element={<AdminActivityLog />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('labintel_admin_auth_v2');
    return !!auth;
  });

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('labintel_admin_auth_v2');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminLayout onLogout={handleLogout} />;
}
