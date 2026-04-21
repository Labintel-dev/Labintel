import { Plus, UserPlus, BarChart3 } from 'lucide-react';
import StatsCards from '../components/StatsCards';
import LiveSessions from '../components/LiveSessions';
import LabCard from '../components/LabCard';
import ActivityFeed from '../components/ActivityFeed';
import TeamTable from '../components/TeamTable';
import { useDashboardData } from '../hooks/useApi';

export default function Dashboard() {
  const { stats, labs, liveSessions, teamMembers, activityLogs, loading } = useDashboardData();
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--accent-cyan)' }}>Loading dashboard from Supabase...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <div className="header-right">
          <div className="system-status">
            <span className="status-dot" />
            All systems operational
          </div>
          <div className="header-date">{today}</div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="action-btn primary"><Plus size={16} /> Onboard New Lab</button>
        <button className="action-btn secondary"><UserPlus size={16} /> Invite Team Member</button>
        <button className="action-btn secondary"><BarChart3 size={16} /> Platform Metrics</button>
      </div>

      <StatsCards stats={stats} />
      <LiveSessions sessions={liveSessions} />

      <div className="dashboard-split">
        <div>
          <div className="section-header">
            <span className="section-title">Lab Management</span>
            <button className="view-all-btn">View All {labs.length} →</button>
          </div>
          <div className="labs-grid">
            {labs.slice(0, 4).map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        </div>
        <ActivityFeed activities={activityLogs} />
      </div>

      <TeamTable members={teamMembers} />
    </div>
  );
}
