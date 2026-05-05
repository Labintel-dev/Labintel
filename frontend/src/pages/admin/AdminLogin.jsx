import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, FlaskConical, Lock, Mail, AlertCircle } from 'lucide-react';

const ADMIN_EMAIL = 'admin@labintel.in';
const ADMIN_PASSWORD = 'admin@1234';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 1000));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('labintel_admin_auth_v2', JSON.stringify({
        user: 'Super Admin',
        role: 'SUPER ADMIN',
        email,
        loginAt: new Date().toISOString(),
      }));
      onLogin();
    } else {
      setError('Invalid credentials. Please check your email and password.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }

    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />
      <div className="login-grid-pattern" />

      <div className={`login-card ${shake ? 'login-shake' : ''}`}>
        <div className="login-brand">
          <div className="login-logo">
            <div className="login-logo-icon">
              <FlaskConical size={28} />
            </div>
            <div className="login-logo-glow" />
          </div>
          <h1 className="login-title">LabIntel</h1>
          <span className="login-subtitle">SUPER ADMIN PANEL</span>
        </div>

        <div className="login-security-badge">
          <ShieldCheck size={14} />
          <span>Secure Admin Access</span>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="admin-email">EMAIL ADDRESS</label>
            <div className="login-input-wrap">
              <Mail size={16} className="login-input-icon" />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@labintel.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="admin-password">PASSWORD</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="login-spinner" />
            ) : (
              <>
                <Lock size={16} />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Protected by LabIntel Security</p>
          <p className="login-version">v2.4.0 — Enterprise Edition</p>
        </div>
      </div>
    </div>
  );
}
