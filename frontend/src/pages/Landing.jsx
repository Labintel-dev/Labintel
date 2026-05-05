import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Activity, Shield, Users, Phone, KeyRound,
  FileText, TrendingUp, Zap, CheckCircle, ArrowLeft
} from 'lucide-react';
import { authService } from '../services/reportService';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/* ──────────────────────────────────────────────────────────────────
   Phone + OTP Login Component
────────────────────────────────────────────────────────────────── */
function PhoneOtpLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^\+91[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid Indian phone number (+91XXXXXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOtp(phone);
      setMessage(res.message || 'OTP sent!');
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const { token, patient } = await authService.verifyOtp(phone, otp);
      setAuth(token, { ...patient, role: 'patient' }, null);
      navigate('/patient');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 ' +
    'outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400';

  return (
    <AnimatePresence mode="wait">
      {step === 'phone' ? (
        <motion.form
          key="phone-step"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSendOtp}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className={`${inputClass} pl-10`}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {message && (
            <p className="text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 shadow-lg shadow-teal-600/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </motion.form>
      ) : (
        <motion.form
          key="otp-step"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleVerifyOtp}
          className="space-y-4"
        >
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="flex items-center gap-1 text-xs text-teal-600 font-medium hover:underline mb-1"
          >
            <ArrowLeft size={12} /> Change number
          </button>

          <p className="text-xs text-slate-500">
            Enter the 6-digit OTP sent to <span className="font-bold text-slate-700">{phone}</span>
          </p>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              OTP Code
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className={`${inputClass} pl-10 tracking-[0.3em] text-center text-lg font-mono`}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 shadow-lg shadow-teal-600/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full text-xs text-teal-600 font-medium hover:underline"
          >
            Resend OTP
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Feature cards
────────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50',
    title: 'AI-Powered Insights',
    desc: 'Advanced AI decodes complex lab reports into simple, actionable health summaries.'
  },
  {
    icon: Shield, color: 'text-teal-600', bg: 'bg-teal-50',
    title: 'Secure & Private',
    desc: 'Bank-grade encryption ensures your medical data remains completely private.'
  },
  {
    icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50',
    title: 'Multi-Lab Support',
    desc: 'View reports from all your diagnostic labs in one unified dashboard.'
  },
];

const benefits = [
  { icon: FileText, text: 'View all your lab reports instantly' },
  { icon: TrendingUp, text: 'Track health trends over time' },
  { icon: Zap, text: 'AI-generated health summaries' },
];

/* ──────────────────────────────────────────────────────────────────
   Main Landing Page
────────────────────────────────────────────────────────────────── */
export default function Landing() {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'google'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-200">

      {/* ── Navigation ── */}
      <nav className="w-full relative z-50 glass border-b border-slate-200/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
              <FlaskConical size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-cyan-700">
              LabIntel
            </span>
          </div>

          <a
            href="#login-card"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            Patient Login
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

        <div className="w-full max-w-7xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-16 items-center relative z-10">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              The Next Generation Patient Portal
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Diagnostic insights,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                delivered beautifully.
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Access all your lab reports in one secure place. LabIntel connects you with
              your diagnostic labs and transforms complex results into clear health insights.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-slate-700">
                  <span className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-teal-600" />
                  </span>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — Sign-In Card */}
          <motion.div
            id="login-card"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 max-w-sm">
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center shadow-xl shadow-teal-500/30 mb-3">
                  <FlaskConical size={26} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Patient Portal</h2>
                <p className="text-slate-500 text-xs mt-1">Sign in to access your health reports</p>
              </div>

              {/* Method Tabs */}
              <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                <button
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    loginMethod === 'phone'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📱 Phone OTP
                </button>
                <button
                  onClick={() => setLoginMethod('google')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    loginMethod === 'google'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </span>
                </button>
              </div>

              {/* Login Forms */}
              <AnimatePresence mode="wait">
                {loginMethod === 'phone' ? (
                  <motion.div
                    key="phone-login"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PhoneOtpLogin />
                  </motion.div>
                ) : (
                  <motion.div
                    key="google-login"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => { window.location.href = `${API_URL}/auth/patient/google`; }}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-slate-800 bg-white border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                      Your account is created automatically on first sign-in.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer info */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-1.5">
                {['Your data is encrypted end-to-end', 'Access reports from any lab', 'Free for all patients'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={13} className="text-teal-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Lab staff link */}
            <p className="text-center text-xs text-slate-400 mt-4">
              Lab staff?{' '}
              <a href="/lab/citydiag/login" className="text-teal-600 hover:underline font-medium">
                Go to Lab Portal →
              </a>
            </p>
          </motion.div>
        </div>

        {/* ── Feature highlights ── */}
        <div className="w-full bg-white/60 backdrop-blur-md border-t border-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center p-6">
                <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-slate-400 text-sm bg-white/50 border-t border-slate-100">
        © {new Date().getFullYear()} LabIntel Technologies. All rights reserved.
      </footer>
    </div>
  );
}
