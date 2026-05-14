export default function TeamTable({ members }) {
  const getRoleClass = (role) => {
    return role.toLowerCase().replace(/\s+/g, '-');
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="team-section">
      <div className="section-header">
        <span className="section-title" style={{ textDecoration: 'none', fontSize: '15px', color: 'var(--text-primary)' }}>
          Your Team ({members.length} Members)
        </span>
        <button className="invite-btn">+ Invite →</button>
      </div>
      <table className="team-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>ROLE</th>
            <th>ASSIGNED LAB</th>
            <th>REPORTS THIS MONTH</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="member-cell">
                  <div className="member-avatar" style={{ background: m.avatar_color }}>
                    {m.initials}
                  </div>
                  <span className="member-name">{m.name}</span>
                </div>
              </td>
              <td>
                <span className={`role-badge ${getRoleClass(m.role)}`}>{m.role}</span>
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{m.assigned_lab}</td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{m.reports_this_month}</td>
              <td>
                <span className={`status-badge ${getStatusClass(m.status)}`}>{m.status}</span>
              </td>
              <td>
                {m.is_owner ? (
                  <span className="owner-label">Owner</span>
                ) : (
                  <button className="edit-btn">Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
