import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';

const API_BASE   = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const ADMIN_API  = `${API_BASE}/admin`;

function useReportsData() {
  const [reports,        setReports]        = useState([]);
  const [summary,        setSummary]        = useState({ todayCount: 0, completedCount: 0, processingCount: 0, failedCount: 0, total: 0 });
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [refreshKey,     setRefreshKey]     = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetch_() {
      try {
        setLoading(true);
        const res  = await fetch(`${ADMIN_API}/reports?limit=50`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setReports(json.reports || []);
          setSummary({
            todayCount:     json.todayCount     ?? 0,
            completedCount: json.completedCount ?? 0,
            processingCount:json.processingCount?? 0,
            failedCount:    json.failedCount    ?? 0,
            total:          json.total          ?? 0,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch_();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return { reports, summary, loading, error, refetch: () => setRefreshKey(k => k + 1) };
}

export default function ReportsLogs() {
  const { reports, summary, loading, error, refetch } = useReportsData();

  const exportCSV = () => {
    const headers = ['Lab', 'Test Type', 'Patient', 'Date', 'Status'];
    const rows    = reports.map(r => [r.lab, r.type, r.patient, r.date, r.status]);
    const csv     = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob    = new Blob([csv], { type: 'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = `reports-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
        Loading reports…
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Reports &amp; Logs</h2>
        <div className="header-right">
          <button className="action-btn secondary" onClick={refetch} title="Refresh">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="action-btn secondary" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: 'var(--accent-red)', fontSize: '13px' }}>
          Failed to load reports: {error}
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0d9488, #065f46)' }}>
          <div className="stat-label">TOTAL REPORTS TODAY</div>
          <div className="stat-value">{summary.todayCount.toLocaleString()}</div>
          <div className="stat-change">Across all labs</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0891b2, #1e40af)' }}>
          <div className="stat-label">COMPLETED</div>
          <div className="stat-value">{summary.completedCount.toLocaleString()}</div>
          <div className="stat-change">
            {summary.total > 0
              ? `${((summary.completedCount / summary.total) * 100).toFixed(1)}% success rate`
              : 'No reports yet'}
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <div className="stat-label">PROCESSING</div>
          <div className="stat-value">{summary.processingCount}</div>
          <div className="stat-change">In queue</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)' }}>
          <div className="stat-label">FAILED</div>
          <div className="stat-value">{summary.failedCount}</div>
          <div className="stat-change">Needs attention</div>
        </div>
      </div>

      <div className="team-section">
        <div className="section-header">
          <span className="section-title" style={{ textDecoration: 'none', fontSize: '15px', color: 'var(--text-primary)' }}>
            <FileText size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Recent Reports
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{summary.total.toLocaleString()} total</span>
        </div>

        {reports.length === 0 ? (
          <div className="page-placeholder" style={{ height: '30vh' }}>
            <FileText size={36} style={{ opacity: 0.3 }} />
            <p>No reports found in the database yet.</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
