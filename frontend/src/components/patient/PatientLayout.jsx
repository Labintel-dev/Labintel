import { Link, useNavigate } from 'react-router-dom';
import { usePatientAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FileText, TrendingUp, User, LogOut, FlaskConical,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/reports',   label: 'My Reports', icon: <FileText size={18} /> },
  { to: '/trends',    label: 'Health Trends', icon: <TrendingUp size={18} /> },
  { to: '/profile',   label: 'Profile',    icon: <User size={18} /> },
];

export function PatientLayout({ children }) {
  const { clearAuth, user } = usePatientAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { clearAuth(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center text-white">
              <FlaskConical size={16} />
            </div>
            <span className="text-lg font-bold text-gradient">LabIntel</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50 transition-all"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.full_name?.[0] || 'P'}
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-10">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-teal-600 transition-colors"
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        {children}
      </main>
    </div>
  );
}
