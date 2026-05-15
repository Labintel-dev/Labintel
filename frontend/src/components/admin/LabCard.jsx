export default function LabCard({ lab, onStatusChange, onDelete, onView, onEdit }) {
  const statusClass = lab.status.toLowerCase();

  const getActions = () => {
    switch (lab.status) {
      case 'ACTIVE':
        return (
          <>
            <button className="lab-action-btn view" onClick={() => onView?.(lab)}>View</button>
            <button className="lab-action-btn edit" onClick={() => onEdit?.(lab)}>Edit</button>
            <button
              className="lab-action-btn deactivate"
              onClick={() => onStatusChange?.(lab.id, 'INACTIVE')}
            >
              Deactivate
            </button>
          </>
        );
      case 'TRIAL':
        return (
          <>
            <button className="lab-action-btn view" onClick={() => onView?.(lab)}>View</button>
            <button
              className="lab-action-btn activate"
              onClick={() => onStatusChange?.(lab.id, 'ACTIVE')}
            >
              Activate
            </button>
            <button
              className="lab-action-btn remove"
              onClick={() => onDelete?.(lab.id)}
            >
              Remove
            </button>
          </>
        );
      case 'INACTIVE':
        return (
          <>
            <button className="lab-action-btn view" onClick={() => onView?.(lab)}>View</button>
            <button
              className="lab-action-btn reactivate"
              onClick={() => onStatusChange?.(lab.id, 'ACTIVE')}
            >
              Re-activate
            </button>
            <button
              className="lab-action-btn delete"
              onClick={() => onDelete?.(lab.id)}
            >
              Delete
            </button>
          </>
        );
      default:
        return <button className="lab-action-btn view" onClick={() => onView?.(lab)}>View</button>;
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
          <div className="lab-stat-value">{(lab.patients_count || 0).toLocaleString()}</div>
          <div className="lab-stat-label">Patients</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.reports_count || 0}</div>
          <div className="lab-stat-label">Reports</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-value">{lab.live_now || 0}</div>
          <div className="lab-stat-label">Live now</div>
        </div>
      </div>
      <div className="lab-actions">{getActions()}</div>
    </div>
  );
}
