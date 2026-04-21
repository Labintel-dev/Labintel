import { useState } from 'react';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'LabIntel',
    adminEmail: 'admin@labintel.in',
    timezone: 'Asia/Kolkata',
    autoRefresh: true,
    refreshInterval: 30,
    emailNotifications: true,
    slackNotifications: false,
    darkMode: true,
  });

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Settings</h2>
        <div className="header-right">
          <button className="action-btn primary"><Save size={16} /> Save Changes</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '900px' }}>
        {/* General */}
        <div className="team-section">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--accent-cyan)' }}>General</h3>
          <div className="modal-field">
            <label>SITE NAME</label>
            <input value={settings.siteName} onChange={e => update('siteName', e.target.value)} />
          </div>
          <div className="modal-field">
            <label>ADMIN EMAIL</label>
            <input value={settings.adminEmail} onChange={e => update('adminEmail', e.target.value)} />
          </div>
          <div className="modal-field">
            <label>TIMEZONE</label>
            <select value={settings.timezone} onChange={e => update('timezone', e.target.value)}>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
        </div>

        {/* Dashboard */}
        <div className="team-section">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--accent-cyan)' }}>Dashboard</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Auto-refresh</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Refresh live sessions automatically</div>
            </div>
            <div onClick={() => update('autoRefresh', !settings.autoRefresh)} style={{
              width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s',
              background: settings.autoRefresh ? 'var(--accent-cyan)' : 'var(--border)', position: 'relative'
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute',
                top: '3px', transition: 'all 0.3s',
                left: settings.autoRefresh ? '23px' : '3px',
              }} />
            </div>
          </div>
          <div className="modal-field" style={{ marginTop: '14px' }}>
            <label>REFRESH INTERVAL (SECONDS)</label>
            <input type="number" value={settings.refreshInterval} onChange={e => update('refreshInterval', e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Dark Mode</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Always enabled</div>
            </div>
            <div style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: 'var(--accent-cyan)', position: 'relative', opacity: 0.6
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute',
                top: '3px', left: '23px',
              }} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="team-section" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--accent-cyan)' }}>Notifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Email Notifications</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get alerts via email</div>
              </div>
              <div onClick={() => update('emailNotifications', !settings.emailNotifications)} style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s',
                background: settings.emailNotifications ? 'var(--accent-cyan)' : 'var(--border)', position: 'relative'
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute',
                  top: '3px', transition: 'all 0.3s',
                  left: settings.emailNotifications ? '23px' : '3px',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Slack Notifications</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get alerts via Slack</div>
              </div>
              <div onClick={() => update('slackNotifications', !settings.slackNotifications)} style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s',
                background: settings.slackNotifications ? 'var(--accent-cyan)' : 'var(--border)', position: 'relative'
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute',
                  top: '3px', transition: 'all 0.3s',
                  left: settings.slackNotifications ? '23px' : '3px',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
