import LiveSessions from '../components/LiveSessions';
import { useApi } from '../hooks/useApi';

export default function LiveUsers() {
  const { data: labs = [], loading: labsLoading } = useApi('/labs');
  const { data: sessions = [], loading: sessionsLoading } = useApi('/sessions');

  const totalLive = labs.reduce((sum, l) => sum + (l.live_now || 0), 0);
  const loading = labsLoading || sessionsLoading;

  if (loading) {
    return <div className="main-content" style={{ color: 'var(--accent-cyan)' }}>Loading live data...</div>;
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
          <div className="stat-value">{labs.filter(l => l.live_now > 0).length}</div>
          <div className="stat-change">With live sessions</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
          <div className="stat-label">PEAK TODAY</div>
          <div className="stat-value">89</div>
          <div className="stat-change">At 2:30 PM</div>
        </div>
      </div>

      <LiveSessions sessions={sessions} />

      <div style={{ marginTop: '24px' }}>
        <div className="section-header">
          <span className="section-title">All Lab Sessions</span>
        </div>
        <div className="team-section" style={{ marginTop: '0' }}>
          <table className="team-table">
            <thead>
              <tr>
                <th>LAB</th>
                <th>SUBDOMAIN</th>
                <th>STATUS</th>
                <th>LIVE USERS</th>
                <th>PATIENTS TODAY</th>
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
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{lab.subdomain}</td>
                  <td><span className={`lab-status ${lab.status.toLowerCase()}`}>{lab.status}</span></td>
                  <td style={{ fontWeight: 700, color: lab.live_now > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                    {lab.live_now || '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{Math.floor(lab.patients_count / 30)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
