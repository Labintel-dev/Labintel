import { RefreshCw } from 'lucide-react';
import LiveSessions from '../../components/admin/LiveSessions';
import { useApi } from '../../hooks/useAdminApi';

export default function LiveUsers() {
  const { data: labs = [], loading: labsLoading, refetch: refetchLabs } = useApi('/labs');
  const { data: sessions = [], loading: sessionsLoading, refetch: refetchSessions } = useApi('/sessions');

  const totalLive   = labs.reduce((sum, l) => sum + (l.live_now || 0), 0);
  const activeLabs  = labs.filter(l => l.status === 'ACTIVE').length;
  const loading     = labsLoading || sessionsLoading;

  const handleRefresh = () => { refetchLabs(); refetchSessions(); };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
        Loading live data…
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Live Users</h2>
        <div className="header-right">
          <div className="system-status">
            <span className="status-dot" />
            {totalLive} users online
          </div>
          <button className="action-btn secondary" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0d9488, #065f46)' }}>
          <div className="stat-label">TOTAL LIVE USERS</div>
          <div className="stat-value">{totalLive}</div>
          <div className="stat-change">Across all labs</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0891b2, #1e40af)' }}>
          <div className="stat-label">ACTIVE LABS</div>
          <div className="stat-value">{activeLabs}</div>
          <div className="stat-change">Labs with active status</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
          <div className="stat-label">TOTAL REGISTERED LABS</div>
          <div className="stat-value">{labs.length}</div>
          <div className="stat-change">All statuses</div>
        </div>
      </div>

      <LiveSessions sessions={sessions} />

      <div style={{ marginTop: '24px' }}>
        <div className="section-header">
          <span className="section-title">All Lab Sessions</span>
        </div>
        {labs.length === 0 ? (
          <div className="page-placeholder" style={{ height: '30vh' }}>
            <p>No labs registered yet.</p>
          </div>
        ) : (
          <div className="team-section" style={{ marginTop: '0' }}>
            <table className="team-table">
              <thead>
                <tr>
                  <th>LAB</th>
                  <th>SUBDOMAIN</th>
                  <th>STATUS</th>
                  <th>LIVE USERS</th>
                  <th>TOTAL PATIENTS</th>
                  <th>TOTAL REPORTS</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab.id}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar" style={{ background: lab.avatar_color }}>{lab.code}</div>
                        <span className="member-name">{lab.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{lab.subdomain || '—'}</td>
                    <td><span className={`lab-status ${lab.status.toLowerCase()}`}>{lab.status}</span></td>
                    <td style={{ fontWeight: 700, color: lab.live_now > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {lab.live_now || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{(lab.patients_count || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{(lab.reports_count || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
