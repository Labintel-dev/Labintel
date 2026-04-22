import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, FlaskConical, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage({ onLogin }) {
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

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1200));

    // Hardcoded admin credentials (replace with real auth later)
    if (email === 'admin@labintel.in' && password === 'admin123') {
      localStorage.setItem('labintel_auth', JSON.stringify({
        user: 'Rahul Agarwal',
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
      {/* Animated background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      {/* Floating grid pattern */}
      <div className="login-grid-pattern" />

      <div className={`login-card ${shake ? 'login-shake' : ''}`}>
        {/* Brand header */}
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

        {/* Security badge */}
        <div className="login-security-badge">
          <ShieldCheck size={14} />
          <span>Secure Admin Access</span>
        </div>

        {/* Error message */}
        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-email">EMAIL ADDRESS</label>
            <div className="login-input-wrap">
              <Mail size={16} className="login-input-icon" />
              <input
                id="login-email"
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
            <label htmlFor="login-password">PASSWORD</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                id="login-password"
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

          <div className="login-options">
            <label className="login-remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="button" className="login-forgot-btn">
              Forgot password?
            </button>
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

        {/* Footer */}
        <div className="login-footer">
          <p>Protected by LabIntel Security</p>
          <p className="login-version">v2.4.0 — Enterprise Edition</p>
        </div>
      </div>
    </div>
  );
}
