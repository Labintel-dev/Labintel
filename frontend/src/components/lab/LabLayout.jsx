import { NavLink, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useLabContext } from '../../hooks/useLabContext';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard, Users, FileText, FilePlus, BarChart2, Settings,
  LogOut, FlaskConical, CheckCircle,
} from 'lucide-react';

// ── Main menu items ─────────────────────────────────────────────────────────
const mainMenuItems = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrator', 'receptionist', 'technician'] },
  { to: 'patients',  label: 'Patients',  icon: Users,           roles: ['administrator', 'receptionist', 'technician'] },
  { to: 'reports',   label: 'Reports',   icon: FileText,        roles: ['administrator', 'receptionist', 'technician'] },
  { to: 'reports/new', label: 'New report', icon: FilePlus,      roles: ['administrator', 'technician'] },
];

// ── Restricted (admin-only) items ───────────────────────────────────────────
const restrictedItems = [
  { to: 'analytics', label: 'Analytics',       icon: BarChart2,   roles: ['administrator'] },
  { to: 'settings',  label: 'Settings',        icon: Settings,    roles: ['administrator'] },
  { to: 'release',   label: 'Release report',  icon: CheckCircle, roles: ['administrator'] },
];

export function LabLayout({ children }) {
  const { toggleSidebar } = useUIStore();
  const { clearAuth } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const { labName, logoUrl, primaryColor } = useLabContext();
  const { role } = usePermission();
  const navigate = useNavigate();
  const lp = useLabPath();

  const handleLogout = () => { clearAuth(); navigate(lp('login')); };

  const effectiveRole = role === 'manager' ? 'administrator' : role;

  const visibleMain = mainMenuItems.filter((i) => i.roles.includes(role) || i.roles.includes(effectiveRole));
  const visibleRestricted = restrictedItems.filter((i) => i.roles.includes(role) || i.roles.includes(effectiveRole));

  // Show restricted section to all — but non-admin items show "Admin" badge
  const allRestricted = restrictedItems;

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="flex flex-col w-56 bg-white border-r border-slate-200 shrink-0 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: primaryColor || '#1a56db' }}
          >
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain rounded" />
              : <span>LI</span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight">LabIntel</p>
            <p className="text-[11px] text-slate-500 truncate leading-tight">{labName}</p>
          </div>
        </div>

        {/* ── MAIN MENU ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-2">
            Main Menu
          </p>
          <div className="space-y-0.5">
            {visibleMain.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={lp(item.to)}
                  end={item.to === 'dashboard'}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* ── RESTRICTED ─────────────────────────────────────────────────── */}
          {visibleRestricted.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-6">
                Restricted
              </p>
              <div className="space-y-0.5">
                {visibleRestricted.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={lp(item.to)}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                      )}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* ── User info + Logout at bottom ────────────────────────────────── */}
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700 truncate leading-tight">
                {user?.full_name || 'Staff'}
              </p>
              <p className="text-[11px] text-slate-400 capitalize leading-tight">
                {role?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-800">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">{labName}</span>
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
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
