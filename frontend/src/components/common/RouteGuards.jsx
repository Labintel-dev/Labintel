import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function RequireAuth({ children }) {
  const isLoggedIn = useAuthStore((s) => !!s.token);
  // Relative 'login' — resolves to /lab/:slug/login inside LabApp, or /login in PatientApp
  if (!isLoggedIn) return <Navigate to="login" replace />;
  return children;
}

export function RequireRole({ roles, children }) {
  const user = useAuthStore((s) => s.user);
  // Relative 'dashboard' — resolves correctly in both app contexts
  if (!roles.includes(user?.role)) return <Navigate to="dashboard" replace />;
  return children;
}
