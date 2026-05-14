export default function ActivityFeed({ activities = [] }) {
  // Highlight any ALL_CAPS or capitalized lab-looking words in messages
  const highlightMessage = (msg = '') => {
    // Bold text between «» markers if the backend wraps lab names (not currently done)
    // Simple: bold any word 3+ chars surrounded by non-word chars that looks like a proper noun
    return msg.replace(/\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})*)\b/g, '<strong>$1</strong>');
  };

  return (
    <div className="activity-feed">
      <div className="section-header">
        <span className="section-title" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '15px' }}>
          Activity Feed
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activities.length} events</span>
      </div>
      {activities.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '16px 0' }}>No activity to display.</p>
      ) : (
        activities.map((a) => (
          <div key={a.id} className="activity-item">
            <div className={`activity-dot ${a.type || 'info'}`} />
            <div>
              <div
                className="activity-text"
                dangerouslySetInnerHTML={{ __html: highlightMessage(a.message) }}
              />
              <div className="activity-time">{a.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
