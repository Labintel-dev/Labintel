export default function LabCard({ lab }) {
  const statusClass = lab.status.toLowerCase();

  const getActions = () => {
    switch (lab.status) {
      case 'ACTIVE':
        return (
          <>
            <button className="lab-action-btn view">View</button>
            <button className="lab-action-btn edit">Edit</button>
            <button className="lab-action-btn deactivate">Deactivate</button>
          </>
        );
      case 'TRIAL':
        return (
          <>
            <button className="lab-action-btn view">View</button>
            <button className="lab-action-btn activate">Activate</button>
            <button className="lab-action-btn remove">Remove</button>
          </>
        );
      case 'INACTIVE':
        return (
          <>
            <button className="lab-action-btn view">View</button>
            <button className="lab-action-btn reactivate">Re-activate</button>
            <button className="lab-action-btn delete">Delete</button>
          </>
        );
      default:
        return <button className="lab-action-btn view">View</button>;
    }
  };

  return (
    <div className="lab-card">
      <div className="lab-card-header">
        <div className="lab-avatar" style={{ background: lab.avatar_color }}>
          {lab.code}
        </div>
        <div className="lab-card-info">
          <div className="lab-card-name">{lab.name}</div>
          <div className="lab-card-subdomain">{lab.subdomain}</div>
        </div>
        <span className={`lab-status ${statusClass}`}>{lab.status}</span>
      </div>
      <div className="lab-stats">
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.patients_count.toLocaleString()}</div>
          <div className="lab-stat-label">Patients</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.reports_count}</div>
          <div className="lab-stat-label">Reports</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.live_now || 'O'}</div>
          <div className="lab-stat-label">Live now</div>
        </div>
      </div>
      <div className="lab-actions">{getActions()}</div>
    </div>
  );
}
