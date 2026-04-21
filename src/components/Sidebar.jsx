import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, Users, UserCog,
  FileText, Activity, Settings,
} from 'lucide-react';

const navItems = [
  { section: 'OVERVIEW', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/labs', icon: FlaskConical, label: 'All Labs', badge: '18' },
    { to: '/live-users', icon: Users, label: 'Live Users' },
  ]},
  { section: 'MANAGEMENT', items: [
    { to: '/team', icon: UserCog, label: 'Team Members' },
    { to: '/reports', icon: FileText, label: 'Reports & Logs' },
    { to: '/activity', icon: Activity, label: 'Activity Log', badge: '3', badgeRed: true },
  ]},
  { section: 'SYSTEM', items: [
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

export default function Sidebar() {
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
              end={item.to === '/'}
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
        <div className="sidebar-user-avatar" style={{ background: '#6366f1' }}>RA</div>
        <div className="sidebar-user-info">
          <h4>Rahul Agarwal</h4>
          <span>SUPER ADMIN</span>
        </div>
      </div>
    </aside>
  );
}
