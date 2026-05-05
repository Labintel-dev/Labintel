import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useLabContext } from '../../hooks/useLabContext';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard, Users, FileText, FilePlus, BarChart2, Settings,
  LogOut, FlaskConical, CheckCircle, UserCog, Beaker,
} from 'lucide-react';

// ── Main menu items ─────────────────────────────────────────────────────────
const mainMenuItems = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrator', 'receptionist', 'technician'] },
  { to: 'patients',  label: 'Patients',  icon: Users,           roles: ['administrator', 'receptionist', 'technician'] },
  { to: 'reports',   label: 'Reports',   icon: FileText,        roles: ['administrator', 'receptionist', 'technician'] },
  { to: 'reports/new', label: 'New report', icon: FilePlus,      roles: ['technician'] },
];

// ── Restricted (admin-only) items ───────────────────────────────────────────
const restrictedItems = [
  { to: 'analytics', label: 'Analytics',       icon: BarChart2,   roles: ['administrator', 'manager'] },
  { to: 'settings',  label: 'Settings',        icon: Settings,    roles: ['administrator', 'manager'] },
  { to: 'release',   label: 'Release report',  icon: CheckCircle, roles: ['administrator', 'manager'] },
];

// ── Manager-only admin items ────────────────────────────────────────────────
const managerItems = [
  { to: 'staff',          label: 'Staff management', icon: UserCog,  roles: ['administrator', 'manager'] },
  { to: 'staff-tracking', label: 'Staff Tracking',   icon: Users,    roles: ['administrator', 'manager'] },
  { to: 'test-panels',    label: 'Test panels',      icon: Beaker,   roles: ['administrator', 'manager'] },
  { to: 'lab-settings',   label: 'Lab settings',     icon: Settings,  roles: ['administrator', 'manager'] },
];

export function LabLayout({ children }) {
  const { sidebarOpen, setSidebar, toggleSidebar } = useUIStore();
  const { clearAuth } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const { labName, logoUrl, primaryColor } = useLabContext();
  const { role } = usePermission();
  const navigate = useNavigate();
  const lp = useLabPath();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebar(false);
    }
  }, [setSidebar]);

  const handleLogout = () => { clearAuth(); navigate(lp('login')); };

  const visibleMain = mainMenuItems.filter((i) => i.roles.includes(role));
  const visibleRestricted = restrictedItems.filter((i) => i.roles.includes(role));
  const visibleManager = managerItems.filter((i) => i.roles.includes(role));

  // Show restricted section to all — but non-admin items show "Admin" badge
  const allRestricted = restrictedItems;

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 overflow-x-hidden lg:flex-row">
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-teal-500" />
        Menu
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/35 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:static lg:z-20 lg:w-64 lg:translate-x-0 lg:shadow-none',
        sidebarOpen ? 'translate-x-0' : ''
      )}>
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

          {/* ── MANAGER ADMIN ──────────────────────────────────────────────── */}
          {visibleManager.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-6">
                Admin
              </p>
              <div className="space-y-0.5">
                {visibleManager.map((item) => {
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
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-800">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">{labName}</span>
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
