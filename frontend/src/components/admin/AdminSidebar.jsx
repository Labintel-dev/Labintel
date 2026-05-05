import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, Users,
  FileText, Activity, Settings, LogOut,
} from 'lucide-react';
import { useApi } from '../../hooks/useAdminApi';

export default function AdminSidebar({ onLogout }) {
  const { data: labs  = [] } = useApi('/labs');
  const { data: activity = [] } = useApi('/activity?limit=20');

  const labCount    = labs.length;
  const alertCount  = activity.filter(a => a.type === 'error' || a.type === 'warning').length;

  const navItems = [
    { section: 'OVERVIEW', items: [
      { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/labs',       icon: FlaskConical,    label: 'All Labs',  badge: labCount > 0 ? String(labCount) : null },
      { to: '/admin/live-users', icon: Users,           label: 'Live Users' },
    ]},
    { section: 'MANAGEMENT', items: [
      { to: '/admin/reports',  icon: FileText, label: 'Reports & Logs' },
      { to: '/admin/activity', icon: Activity, label: 'Activity Log', badge: alertCount > 0 ? String(alertCount) : null, badgeRed: true },
    ]},
    { section: 'SYSTEM', items: [
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ]},
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>LabIntel</h1>
        <span>SUPER ADMIN</span>
      </div>

      {navItems.map((section) => (
        <div className="sidebar-section" key={section.section}>
          <div className="sidebar-section-label">{section.section}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              {item.label}
              {item.badge && (
                <span className={`sidebar-badge ${item.badgeRed ? 'red' : ''}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="sidebar-user">
        <div className="sidebar-user-avatar" style={{ background: '#6366f1' }}>SA</div>
        <div className="sidebar-user-info">
          <h4>Super Admin</h4>
          <span>ADMIN</span>
        </div>
        {onLogout && (
          <button className="sidebar-logout-btn" onClick={onLogout} title="Sign Out">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
