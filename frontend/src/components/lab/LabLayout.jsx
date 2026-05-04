import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLabContext } from '../../hooks/useLabContext';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard, Users, FileText, FilePlus, BarChart2, Settings,
  LogOut, X, Menu, UserCog, Beaker,
} from 'lucide-react';

const mainMenuItems = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrator', 'receptionist', 'technician', 'manager'] },
  { to: 'patients', label: 'Patients', icon: Users, roles: ['administrator', 'receptionist', 'technician', 'manager'] },
  { to: 'reports', label: 'Reports', icon: FileText, roles: ['administrator', 'receptionist', 'technician', 'manager'] },
  { to: 'reports/new', label: 'New report', icon: FilePlus, roles: ['technician', 'administrator', 'manager'] },
];

const restrictedItems = [
  { to: 'analytics', label: 'Analytics', icon: BarChart2, roles: ['administrator', 'manager'] },
  { to: 'release', label: 'Release report', icon: FileText, roles: ['administrator', 'manager'] },
];

const managerItems = [
  { to: 'staff', label: 'Staff management', icon: UserCog, roles: ['administrator', 'manager'] },
  { to: 'staff-tracking', label: 'Staff tracking', icon: Users, roles: ['administrator', 'manager'] },
  { to: 'test-panels', label: 'Test panels', icon: Beaker, roles: ['administrator', 'manager'] },
  { to: 'lab-settings', label: 'Lab settings', icon: Settings, roles: ['administrator', 'manager'] },
];

function SectionTitle({ children }) {
  return (
    <p className="px-2 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

export function LabLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { clearAuth } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const { labName, logoUrl, primaryColor } = useLabContext();
  const { role } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const lp = useLabPath();

  const handleLogout = () => {
    clearAuth();
    navigate(lp('login'));
  };

  const visibleMain = mainMenuItems.filter((i) => i.roles.includes(role));
  const visibleRestricted = restrictedItems.filter((i) => i.roles.includes(role));
  const visibleManager = managerItems.filter((i) => i.roles.includes(role));

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const currentPage = (() => {
    const segment = location.pathname.split('/').filter(Boolean).at(-1) || 'dashboard';
    if (segment === 'new') return 'New report';
    return segment.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  const navLinkClass = ({ isActive }) => cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
    isActive
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
  );

  const renderNavGroup = (items) => items.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={lp(item.to)}
        end={item.to === 'dashboard'}
        className={navLinkClass}
        onClick={() => setMobileNavOpen(false)}
      >
        <Icon size={17} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  });

  const SidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: primaryColor || '#1a56db' }}
          >
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="h-5 w-5 rounded object-contain" />
              : <span>LI</span>}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-800">LabIntel</p>
            <p className="truncate text-[11px] leading-tight text-slate-500">{labName}</p>
          </div>
        </div>

        <button
          onClick={() => setMobileNavOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
        <SectionTitle>Main Menu</SectionTitle>
        <div className="space-y-0.5">{renderNavGroup(visibleMain)}</div>

        {visibleRestricted.length > 0 && (
          <>
            <SectionTitle>Restricted</SectionTitle>
            <div className="space-y-0.5">{renderNavGroup(visibleRestricted)}</div>
          </>
        )}

        {visibleManager.length > 0 && (
          <>
            <SectionTitle>Admin</SectionTitle>
            <div className="space-y-0.5">{renderNavGroup(visibleManager)}</div>
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-slate-700">
              {user?.full_name || 'Staff'}
            </p>
            <p className="text-[11px] capitalize leading-tight text-slate-400">
              {role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/35 transition-opacity md:hidden',
          mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform md:static md:z-20 md:w-56 md:max-w-none md:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {SidebarContent}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <span className="truncate text-sm font-semibold text-slate-800">{currentPage}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">{labName}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
              {userInitials}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
