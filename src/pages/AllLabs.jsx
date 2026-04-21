import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import LabCard from '../components/LabCard';
import { useApi } from '../hooks/useApi';

export default function AllLabs() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { data: labs = [], loading } = useApi('/labs');

  const filtered = labs.filter((l) => {
    const matchFilter = filter === 'ALL' || l.status === filter;
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return <div className="main-content" style={{ color: 'var(--accent-cyan)' }}>Loading labs...</div>;
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>All Labs</h2>
        <div className="header-right">
          <div className="system-status">
            <span className="status-dot" />
            All systems operational
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <button className="action-btn primary"><Plus size={16} /> Onboard New Lab</button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '8px 14px', flex: 1, maxWidth: '320px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '13px', width: '100%',
              fontFamily: 'Inter, sans-serif'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'ACTIVE', 'TRIAL', 'INACTIVE'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                background: filter === f ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)',
                color: filter === f ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderColor: filter === f ? 'rgba(6,182,212,0.3)' : 'var(--border)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="labs-grid">
        {filtered.map((lab) => (
          <LabCard key={lab.id} lab={lab} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="page-placeholder">
          <h3>No labs found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}
