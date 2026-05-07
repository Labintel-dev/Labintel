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
  PATIENT LOGIN PAGE — Phone OTP
══════════════════════════════════════════════════════════════════════════ */
const RoleSelectPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

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

      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-16 flex flex-col items-center justify-center">
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
          className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 relative p-8 md:p-12 box-border"
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
            <div className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-white text-[#14453d] shadow-sm text-center">
              📱 Phone OTP
            </div>
          </div>

          {/* ── Phone OTP Login ── */}
          <AnimatePresence mode="wait">
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
