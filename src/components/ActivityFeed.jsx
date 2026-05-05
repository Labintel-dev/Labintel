export default function ActivityFeed({ activities }) {
  const highlightLab = (msg) => {
    const labs = ['Apollo', 'Sunrise', 'CityLab', 'NovaCare', 'MedCare', 'HealthFirst', 'DiagnoPlus', 'PrimeLab'];
    let result = msg;
    labs.forEach((lab) => {
      result = result.replace(new RegExp(`(${lab})`, 'g'), `<strong>${lab}</strong>`);
    });
    return result;
  };

  return (
    <div className="activity-feed">
      <div className="section-header">
        <span className="section-title" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '15px' }}>
          Activity Feed
        </span>
        <button className="all-logs-btn">All Logs →</button>
      </div>
      {activities.map((a) => (
        <div key={a.id} className="activity-item">
          <div className={`activity-dot ${a.type}`} />
          <div>
            <div
              className="activity-text"
              dangerouslySetInnerHTML={{ __html: highlightLab(a.message) }}
            />
            <div className="activity-time">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
