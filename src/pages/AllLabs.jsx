import { useState } from 'react';
import { Plus, Search, X, FlaskConical } from 'lucide-react';
import LabCard from '../components/LabCard';
import { useApi, mutateApi } from '../hooks/useApi';

const AVATAR_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#3b82f6',
];

function getRandomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function generateCode(name) {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function AllLabs() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewLab, setViewLab] = useState(null);
  const [editLab, setEditLab] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editFormName, setEditFormName] = useState('');
  const [editFormSubdomain, setEditFormSubdomain] = useState('');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSubdomain, setFormSubdomain] = useState('');
  const [formStatus, setFormStatus] = useState('TRIAL');

  const { data: labs = [], loading, refetch } = useApi('/labs');

  const filtered = labs.filter((l) => {
    const matchFilter = filter === 'ALL' || l.status === filter;
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    ALL: labs.length,
    ACTIVE: labs.filter((l) => l.status === 'ACTIVE').length,
    TRIAL: labs.filter((l) => l.status === 'TRIAL').length,
    INACTIVE: labs.filter((l) => l.status === 'INACTIVE').length,
  };

  const resetForm = () => {
    setFormName('');
    setFormSubdomain('');
    setFormStatus('TRIAL');
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleAddLab = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const code = generateCode(formName);
      await mutateApi('/labs', 'POST', {
        name: formName.trim(),
        code,
        subdomain: formSubdomain.trim() || `${formName.trim().toLowerCase().replace(/\s+/g, '')}.labintel.in`,
        status: formStatus,
        patients_count: 0,
        reports_count: 0,
        live_now: 0,
        avatar_color: getRandomColor(),
      });
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err) {
      alert('Failed to add lab: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (labId, newStatus) => {
    try {
      await mutateApi(`/labs/${labId}`, 'PUT', { status: newStatus });
      refetch();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (labId) => {
    setDeleting(true);
    try {
      await mutateApi(`/labs/${labId}`, 'DELETE');
      setConfirmDelete(null);
      refetch();
    } catch (err) {
      alert('Failed to delete lab: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditLabSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await mutateApi(`/labs/${editLab.id}`, 'PUT', {
        name: editFormName.trim(),
        subdomain: editFormSubdomain.trim() || editLab.subdomain,
      });
      setEditLab(null);
      refetch();
    } catch (err) {
      alert('Failed to update lab: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

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
            {labs.length} labs registered
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="action-btn primary" onClick={handleOpenModal}>
          <Plus size={16} /> Onboard New Lab
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '8px 14px', flex: 1, maxWidth: '320px',
          minWidth: '180px'
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
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div className="labs-grid">
        {filtered.map((lab) => (
          <LabCard
            key={lab.id}
            lab={lab}
            onStatusChange={handleStatusChange}
            onDelete={(id) => setConfirmDelete(id)}
            onView={(lab) => setViewLab(lab)}
            onEdit={(lab) => {
              setEditLab(lab);
              setEditFormName(lab.name);
              setEditFormSubdomain(lab.subdomain);
            }}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="page-placeholder">
          <FlaskConical size={48} />
          <h3>No labs found</h3>
          <p>Try adjusting your search or filter, or onboard a new lab</p>
        </div>
      )}

      {/* ── Add Lab Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Onboard New Lab</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLab}>
              <div className="modal-field">
                <label>LAB NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Diagnostics"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label>SUBDOMAIN</label>
                <input
                  type="text"
                  placeholder="e.g. apollo.labintel.in (auto-generated if empty)"
                  value={formSubdomain}
                  onChange={(e) => setFormSubdomain(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label>INITIAL STATUS</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Preview */}
              {formName.trim() && (
                <div style={{
                  background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px',
                  marginTop: '6px', marginBottom: '8px', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    PREVIEW
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: getRandomColor(), display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#fff'
                    }}>
                      {generateCode(formName)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formName.trim()}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {formSubdomain.trim() || `${formName.trim().toLowerCase().replace(/\s+/g, '')}.labintel.in`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit" disabled={saving}>
                  {saving ? 'Adding...' : '+ Add Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ color: 'var(--accent-red)' }}>Delete Lab</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to permanently delete this lab? This action
              <strong style={{ color: 'var(--accent-red)' }}> cannot be undone</strong> and all associated data will be lost.
            </p>
            <div className="modal-actions">
              <button className="cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="submit"
                disabled={deleting}
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Lab'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Lab Modal ── */}
      {viewLab && (
        <div className="modal-overlay" onClick={() => setViewLab(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Lab Details</h3>
              <button
                onClick={() => setViewLab(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '14px',
                background: viewLab.avatar_color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#fff'
              }}>
                {viewLab.code}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>{viewLab.name}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{viewLab.subdomain}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>STATUS</div>
                <span className={`lab-status ${viewLab.status.toLowerCase()}`}>{viewLab.status}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>PATIENTS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{(viewLab.patients_count || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>REPORTS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{viewLab.reports_count || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>LIVE NOW</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{viewLab.live_now || 0}</div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="submit" onClick={() => setViewLab(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Lab Modal ── */}
      {editLab && (
        <div className="modal-overlay" onClick={() => setEditLab(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Edit Lab Details</h3>
              <button
                onClick={() => setEditLab(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditLabSubmit}>
              <div className="modal-field">
                <label>LAB NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Diagnostics"
                  value={editFormName}
                  onChange={(e) => setEditFormName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label>SUBDOMAIN</label>
                <input
                  type="text"
                  placeholder="e.g. apollo.labintel.in"
                  value={editFormSubdomain}
                  onChange={(e) => setEditFormSubdomain(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel" onClick={() => setEditLab(null)}>Cancel</button>
                <button type="submit" className="submit" disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
