import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, KeyRound, AlertCircle, CheckCircle, ArrowLeft
} from 'lucide-react';
import { Navbar } from './LandingPage';
import { authService } from '../services/reportService';
import { useAuthStore } from '../store/authStore';

const P = '#14453d';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const DEFAULT_PORTAL = {
  id: 'patient',
  label: 'Patient Portal',
  path: '/patient',
  desc: 'View results, book appointments, and manage your health records securely.',
  icon: User,
  iconBg: '#e8f5f0',
  iconColor: '#14453d'
};

/* ══════════════════════════════════════════════════════════════════════════
   PATIENT LOGIN PAGE — Phone OTP + Google
══════════════════════════════════════════════════════════════════════════ */
const RoleSelectPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'google'
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\+91[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid Indian phone number (+91XXXXXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOtp(phone);
      setSuccess(res.message || 'OTP sent!');
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const { token, patient } = await authService.verifyOtp(phone, otp);
      setAuth(token, { ...patient, role: 'patient' }, null);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/patient'), 500);
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all placeholder-gray-400";

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar onLoginClick={() => navigate('/')} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 md:py-16">
        {/* Header */}
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Access Your Portal
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Securely sign in to view your diagnostic reports.
          </p>
        </motion.div>

        {/* Main Interface Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative box-border w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl shadow-gray-200/50 sm:p-8 md:p-12"
        >
          {/* Portal Icon + Title */}
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: DEFAULT_PORTAL.iconBg }}>
              <DEFAULT_PORTAL.icon size={28} style={{ color: DEFAULT_PORTAL.iconColor }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              Welcome
            </h2>
            <p className="text-sm text-gray-500 max-w-[280px]">
              {DEFAULT_PORTAL.desc}
            </p>
          </div>

          {/* Method Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setLoginMethod('phone'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white text-[#14453d] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📱 Phone OTP
            </button>
            <button
              onClick={() => { setLoginMethod('google'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                loginMethod === 'google'
                  ? 'bg-white text-[#14453d] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          {/* ── Phone OTP Login ── */}
          <AnimatePresence mode="wait">
            {loginMethod === 'phone' ? (
              <motion.div
                key="phone-flow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Phone Number</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+919876543210"
                            required
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Alerts */}
                      <AnimatePresence>
                        {error && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <div className="flex items-start gap-2 text-rose-600 text-xs bg-rose-50 rounded-xl p-3 border border-rose-100">
                              <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
                            </div>
                          </motion.div>
                        )}
                        {success && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <div className="flex items-start gap-2 text-emerald-700 text-xs bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                              <CheckCircle size={14} className="shrink-0 mt-0.5" /><span>{success}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 mt-2 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                        style={{ background: P }}
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
                        onClick={() => { setStep('phone'); setOtp(''); setError(''); setSuccess(''); }}
                        className="flex items-center gap-1 text-xs font-bold text-[#14453d] hover:underline mb-1"
                      >
                        <ArrowLeft size={12} /> Change number
                      </button>

                      <p className="text-xs text-gray-500">
                        Enter the 6-digit OTP sent to <span className="font-bold text-gray-700">{phone}</span>
                      </p>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">OTP Code</label>
                        <div className="relative">
                          <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            autoFocus
                            className={`${inputClass} tracking-[0.3em] text-center text-lg font-mono`}
                          />
                        </div>
                      </div>

                      {/* Alerts */}
                      <AnimatePresence>
                        {error && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <div className="flex items-start gap-2 text-rose-600 text-xs bg-rose-50 rounded-xl p-3 border border-rose-100">
                              <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3.5 mt-2 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                        style={{ background: P }}
                      >
                        {loading ? 'Verifying...' : 'Verify & Sign In'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full text-xs font-bold text-[#14453d] hover:underline"
                      >
                        Resend OTP
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* ── Google Login ── */
              <motion.div
                key="google-flow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <a
                  href={`${API_URL}/auth/patient/google`}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 transition-all shadow-lg hover:-translate-y-0.5 border border-gray-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </a>
                <p className="text-center text-xs text-gray-400">
                  Account is created automatically on first sign-in.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Scrollbar styles */}
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default RoleSelectPage;
