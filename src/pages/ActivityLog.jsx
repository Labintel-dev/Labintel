import ActivityFeed from '../components/ActivityFeed';
import { useApi } from '../hooks/useApi';

export default function ActivityLog() {
  const { data: activityLogs = [], loading } = useApi('/activity');

  if (loading) {
    return <div className="main-content" style={{ color: 'var(--accent-cyan)' }}>Loading activity logs...</div>;
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Activity Log</h2>
        <div className="header-right">
          <div className="system-status">
            <span className="status-dot" />
            {activityLogs.length} events
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0d9488, #065f46)' }}>
          <div className="stat-label">SUCCESS</div>
          <div className="stat-value">{activityLogs.filter(l => l.type === 'success').length}</div>
          <div className="stat-change">Events</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0891b2, #1e40af)' }}>
          <div className="stat-label">INFO</div>
          <div className="stat-value">{activityLogs.filter(l => l.type === 'info').length}</div>
          <div className="stat-change">Events</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <div className="stat-label">WARNINGS</div>
          <div className="stat-value">{activityLogs.filter(l => l.type === 'warning').length}</div>
          <div className="stat-change">Events</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)' }}>
          <div className="stat-label">ERRORS</div>
          <div className="stat-value">{activityLogs.filter(l => l.type === 'error').length}</div>
          <div className="stat-change">Events</div>
        </div>
      </div>

      <div style={{ maxWidth: '700px' }}>
        <ActivityFeed activities={activityLogs} />
      </div>
    </div>
  );
}
