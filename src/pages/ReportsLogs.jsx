import { FileText, Download } from 'lucide-react';

const reports = [
  { id: 1, lab: 'Apollo Diagnostics', type: 'Blood Panel', patient: 'Amit Singh', date: '21 Apr 2026', status: 'Completed' },
  { id: 2, lab: 'Sunrise Diagnostics', type: 'Urinalysis', patient: 'Kavita Jain', date: '21 Apr 2026', status: 'Completed' },
  { id: 3, lab: 'Apollo Diagnostics', type: 'Lipid Profile', patient: 'Rohan Das', date: '21 Apr 2026', status: 'Processing' },
  { id: 4, lab: 'City Lab Mumbai', type: 'CBC', patient: 'Priya Menon', date: '20 Apr 2026', status: 'Completed' },
  { id: 5, lab: 'MedCare Pathology', type: 'Thyroid Panel', patient: 'Sanjay Rao', date: '20 Apr 2026', status: 'Completed' },
  { id: 6, lab: 'HealthFirst Labs', type: 'HbA1c', patient: 'Meera Nair', date: '20 Apr 2026', status: 'Failed' },
  { id: 7, lab: 'Apollo Diagnostics', type: 'Liver Function', patient: 'Deepak Gupta', date: '19 Apr 2026', status: 'Completed' },
  { id: 8, lab: 'Sunrise Diagnostics', type: 'Blood Glucose', patient: 'Anita Sharma', date: '19 Apr 2026', status: 'Completed' },
];

export default function ReportsLogs() {
  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Reports & Logs</h2>
        <div className="header-right">
          <button className="action-btn secondary"><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0d9488, #065f46)' }}>
          <div className="stat-label">TOTAL REPORTS</div>
          <div className="stat-value">143</div>
          <div className="stat-change">Today</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0891b2, #1e40af)' }}>
          <div className="stat-label">COMPLETED</div>
          <div className="stat-value">138</div>
          <div className="stat-change">96.5% success rate</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <div className="stat-label">PROCESSING</div>
          <div className="stat-value">3</div>
          <div className="stat-change">In queue</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)' }}>
          <div className="stat-label">FAILED</div>
          <div className="stat-value">2</div>
          <div className="stat-change">Needs attention</div>
        </div>
      </div>

      <div className="team-section">
        <div className="section-header">
          <span className="section-title" style={{ textDecoration: 'none', fontSize: '15px', color: 'var(--text-primary)' }}>
            <FileText size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Recent Reports
          </span>
        </div>
        <table className="team-table">
          <thead>
            <tr>
              <th>LAB</th>
              <th>TEST TYPE</th>
              <th>PATIENT</th>
              <th>DATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{r.lab}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{r.type}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{r.patient}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.date}</td>
                <td>
                  <span className={`status-badge ${r.status === 'Completed' ? 'active' : r.status === 'Processing' ? 'on-leave' : 'inactive'}`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td><button className="edit-btn">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
