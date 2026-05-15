export default function LiveSessions({ sessions = [] }) {
  const maxUsers = Math.max(...sessions.map(s => s.users || s.count || 1), 1);

  return (
    <div className="live-sessions">
      <div className="live-sessions-header">
        <div className="live-sessions-title">
          <span className="live-dot" />
          <span>Live Active Sessions</span>
        </div>
        <span className="auto-refresh">Real-time from database</span>
      </div>
      {sessions.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
          No active sessions at this time.
        </p>
      ) : (
        sessions.map((s) => {
          const users = s.users ?? s.count ?? 0;
          const pct   = Math.min((users / maxUsers) * 100, 100);
          const color = s.color || '#06b6d4';
          return (
            <div key={s.id} className="session-row">
              <div className="session-info">
                <div className="session-lab">{s.lab}</div>
                <div className="session-subdomain">{s.subdomain}</div>
              </div>
              <div className="session-bar-wrap">
                <div
                  className="session-bar"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  }}
                />
              </div>
              <div className="session-count" style={{ color }}>{users}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
