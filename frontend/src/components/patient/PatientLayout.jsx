import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FileText, TrendingUp, User, LogOut, FlaskConical,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: <LayoutDashboard size={18} /> },
  { to: '/reports', label: 'My Reports', mobileLabel: 'Reports', icon: <FileText size={18} /> },
  { to: '/trends', label: 'Health Trends', mobileLabel: 'Trends', icon: <TrendingUp size={18} /> },
  { to: '/profile', label: 'Profile', mobileLabel: 'Profile', icon: <User size={18} /> },
];

export function PatientLayout({ children }) {
  const { clearAuth, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const linkClass = ({ isActive }) => cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
    isActive
      ? 'bg-teal-50 text-teal-700'
      : 'text-slate-600 hover:bg-teal-50 hover:text-teal-600',
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="gradient-teal flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <FlaskConical size={16} />
            </div>
            <span className="text-lg font-bold text-gradient">LabIntel</span>
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              {user?.full_name?.[0] || 'P'}
            </div>
            <button onClick={handleLogout} className="text-slate-400 transition-colors hover:text-red-500" aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white/95 backdrop-blur sm:hidden">
        <div className="grid h-16 grid-cols-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
                isActive ? 'text-teal-600' : 'text-slate-500 hover:text-teal-600',
              )}
            >
              {item.icon}
              <span>{item.mobileLabel}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-24 sm:py-6 sm:pb-6">
        {children}
      </main>
    </div>
  );
}
