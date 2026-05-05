import TeamTable from '../components/TeamTable';
import { useApi } from '../hooks/useApi';

export default function TeamMembers() {
  const { data: teamMembers = [], loading } = useApi('/team');

  const active = teamMembers.filter(m => m.status === 'ACTIVE').length;
  const onLeave = teamMembers.filter(m => m.status === 'ON LEAVE').length;

  if (loading) {
    return <div className="main-content" style={{ color: 'var(--accent-cyan)' }}>Loading team members...</div>;
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Team Members</h2>
        <div className="header-right">
          <div className="system-status">
            <span className="status-dot" />
            {active} active, {onLeave} on leave
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0d9488, #065f46)' }}>
          <div className="stat-label">TOTAL MEMBERS</div>
          <div className="stat-value">{teamMembers.length}</div>
          <div className="stat-change">Team size</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0891b2, #1e40af)' }}>
          <div className="stat-label">ACTIVE</div>
          <div className="stat-value">{active}</div>
          <div className="stat-change">Currently working</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <div className="stat-label">ON LEAVE</div>
          <div className="stat-value">{onLeave}</div>
          <div className="stat-change">Returning soon</div>
        </div>
      </div>

      <TeamTable members={teamMembers} />
    </div>
  );
}
