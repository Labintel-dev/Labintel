import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, KeyRound, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export default function PatientLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loginMethod, setLoginMethod] = useState('phone');
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputClass = 'w-full pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all';

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      const res = await authService.sendOtp(formattedPhone);
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
      const formattedPhone = `+91${phone}`;
      const { token, patient } = await authService.verifyOtp(formattedPhone, otp);
      setAuth(token, { ...patient, role: 'patient' }, null);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/patient'), 500);
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="relative w-full max-w-xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-200/40 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-emerald-100/40 blur-[120px] pointer-events-none" />

        <div className="relative bg-white shadow-2xl shadow-slate-200/70 rounded-[32px] overflow-hidden border border-slate-200">
          <div className="bg-emerald-500 px-8 py-10 text-center text-white">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 mb-6">
              <span className="text-3xl">🩺</span>
            </div>
            <h1 className="text-3xl font-bold">Patient Login</h1>
            <p className="mt-3 text-sm text-slate-100 max-w-md mx-auto">
              Sign in with phone OTP or continue with Google to access your secure health reports.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <div className="flex gap-2 bg-slate-100 rounded-2xl p-2 mb-8">
              <button
                type="button"
                onClick={() => { setLoginMethod('phone'); setError(''); setSuccess(''); }}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition ${loginMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('google'); setError(''); setSuccess(''); }}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition ${loginMethod === 'google' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Google
              </button>
            </div>

            <AnimatePresence mode="wait">
              {loginMethod === 'phone' ? (
                <motion.div
                  key="phone-flow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 'phone' ? (
                    <motion.form
                      key="phone-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSendOtp}
                      className="space-y-5"
                    >
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 mb-2 block">
                          Phone number
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">+91</span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            className={`${inputClass} pl-16`}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {error && (
                          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700 flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5" />
                            <span>{error}</span>
                          </div>
                        )}
                        {success && (
                          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700 flex items-start gap-2">
                            <CheckCircle size={16} className="mt-0.5" />
                            <span>{success}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
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
                      className="space-y-5"
                    >
                      <button
                        type="button"
                        onClick={() => { setStep('phone'); setOtp(''); setError(''); setSuccess(''); }}
                        className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-2"
                      >
                        <ArrowLeft size={14} /> Change number
                      </button>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 mb-2 block">
                          Enter OTP
                        </label>
                        <div className="relative">
                          <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className={`${inputClass} pl-12 tracking-[0.3em] text-center text-lg font-semibold letter-spacing-[0.2em]`}
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700 flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? 'Verifying...' : 'Verify & Sign in'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Resend OTP
                      </button>
                    </motion.form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="google-flow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <a
                    href={`${API_URL}/auth/patient/google`}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </a>
                  <p className="text-center text-sm text-slate-500">
                    Your Google account will be linked to LabIntel for easy future access.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          LabIntel · Secure Health Data · 2025
        </p>
      </div>
    </div>
  );
}
