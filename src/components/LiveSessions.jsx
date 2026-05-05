export default function LiveSessions({ sessions }) {
  return (
    <div className="live-sessions">
      <div className="live-sessions-header">
        <div className="live-sessions-title">
          <span className="live-dot" />
          <span>Live Active Sessions</span>
        </div>
        <span className="auto-refresh">Auto-refreshes every 30s</span>
      </div>
      {sessions.map((s, i) => (
        <div key={i} className="session-row">
          <div className="session-info">
            <div className="session-lab">{s.lab}</div>
            <div className="session-subdomain">{s.subdomain}</div>
          </div>
          <div className="session-bar-wrap">
            <div
              className="session-bar"
              style={{
                width: `${(s.count / s.max) * 100}%`,
                background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`,
              }}
            />
          </div>
          <div className="session-count" style={{ color: s.color }}>{s.count}</div>
        </div>
      ))}
    </div>
  );
}
