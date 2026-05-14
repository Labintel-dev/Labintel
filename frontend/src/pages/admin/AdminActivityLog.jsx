import { RefreshCw } from 'lucide-react';
import ActivityFeed from '../../components/admin/ActivityFeed';
import { useApi } from '../../hooks/useAdminApi';

export default function ActivityLog() {
  const { data: activityLogs = [], loading, error, refetch } = useApi('/activity?limit=100');

  const successCount = activityLogs.filter(l => l.type === 'success').length;
  const infoCount    = activityLogs.filter(l => l.type === 'info').length;
  const warnCount    = activityLogs.filter(l => l.type === 'warning').length;
  const errorCount   = activityLogs.filter(l => l.type === 'error').length;

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
        Loading activity logs…
      </div>
    );
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
          <button className="action-btn secondary" onClick={refetch} title="Refresh">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: 'var(--accent-red)', fontSize: '13px' }}>
          Failed to load activity: {error}
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0d9488, #065f46)' }}>
          <div className="stat-label">SUCCESS</div>
          <div className="stat-value">{successCount}</div>
          <div className="stat-change">Events</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0891b2, #1e40af)' }}>
          <div className="stat-label">INFO</div>
          <div className="stat-value">{infoCount}</div>
          <div className="stat-change">Events</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <div className="stat-label">WARNINGS</div>
          <div className="stat-value">{warnCount}</div>
          <div className="stat-change">Events</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)' }}>
          <div className="stat-label">ERRORS</div>
          <div className="stat-value">{errorCount}</div>
          <div className="stat-change">Events</div>
        </div>
      </div>

      {activityLogs.length === 0 ? (
        <div className="page-placeholder" style={{ height: '40vh' }}>
          <Activity size={48} style={{ opacity: 0.3 }} />
          <h3>No activity yet</h3>
          <p>Activity will appear as reports are created and alerts are triggered.</p>
        </div>
      ) : (
        <div style={{ maxWidth: '720px' }}>
          <ActivityFeed activities={activityLogs} />
        </div>
      )}
    </div>
  );
}
