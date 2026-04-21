import { NavLink, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useLabContext } from '../../hooks/useLabContext';
import { usePermission } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard, Users, FileText, BarChart2, Bell, Settings,
  LogOut, Menu, X, FlaskConical, ChevronRight,
} from 'lucide-react';

// Relative paths — resolve to /lab/:slug/dashboard, /lab/:slug/patients, etc.
const navItems = [
  { to: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['administrator','receptionist','technician'] },
  { to: 'patients',  label: 'Patients',   icon: <Users size={18} />,           roles: ['administrator','receptionist','technician'] },
  { to: 'reports',   label: 'Reports',    icon: <FileText size={18} />,         roles: ['administrator','receptionist','technician'] },
  { to: 'analytics', label: 'Analytics',  icon: <BarChart2 size={18} />,        roles: ['administrator'] },
  { to: 'alerts',    label: 'Alerts',     icon: <Bell size={18} />,             roles: ['administrator'] },
  { to: 'settings',  label: 'Settings',   icon: <Settings size={18} />,         roles: ['administrator','receptionist','technician'] },
];

export function LabLayout({ children }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { clearAuth } = useAuthStore();
  const { labName, logoUrl, primaryColor } = useLabContext();
  const { role } = usePermission();
  const navigate = useNavigate();

  const handleLogout = () => { clearAuth(); navigate('login'); };

  const visibleItems = navItems.filter((i) => i.roles.includes(role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out shrink-0 z-20',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700 h-16">
          <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: primaryColor }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded" />
              : <FlaskConical size={16} />
            }
          </div>
          {sidebarOpen && <span className="text-sm font-semibold truncate">{labName}</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto scrollbar-thin">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Toggle + Logout */}
        <div className="p-2 border-t border-slate-700 space-y-0.5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            {sidebarOpen ? <X size={18} className="shrink-0" /> : <Menu size={18} className="shrink-0" />}
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ChevronRight size={14} />
            <span className="font-medium text-slate-700">{labName}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700">{useAuthStore.getState().user?.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{role?.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
              {useAuthStore.getState().user?.full_name?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
