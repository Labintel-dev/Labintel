import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, KeyRound, AlertCircle, CheckCircle, ArrowLeft, User } from 'lucide-react';
import { authService } from '../../services/reportService';
import { usePatientAuthStore } from '../../store/authStore';

export default function PatientLogin() {
  const navigate = useNavigate();
  const setAuth = usePatientAuthStore((s) => s.setAuth);

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Access Your Portal</h1>
        <p className="text-slate-500 text-sm">Securely sign in to view your diagnostic reports.</p>
      </div>

      <div className="w-full max-w-[480px]">
        <div className="bg-white shadow-xl shadow-slate-200/60 rounded-[32px] border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-6">
              <User size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              View results, book appointments, and <br className="hidden sm:block" /> manage your health records securely.
            </p>

            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white border border-slate-100 shadow-sm px-6 py-2 rounded-xl text-xs font-semibold text-slate-700">
                <span className="text-lg">📱</span> Phone OTP
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'phone' ? (
                <motion.form
                  key="phone-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSendOtp}
                  className="space-y-6"
                >
                  <div className="text-left">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <Phone size={16} />
                        <span className="text-sm border-r border-slate-200 pr-2">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter your number"
                        className={`${inputClass} pl-24`}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 flex items-start gap-2">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span className="text-left">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-[#0f3d35] py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#0a2e28] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
                  onSubmit={handleVerifyOtp}
                  className="space-y-6"
                >
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setError(''); setSuccess(''); }}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                  >
                    <ArrowLeft size={14} /> Change number (+91 {phone})
                  </button>

                  <div className="text-left">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">
                      Enter OTP
                    </label>
                    <div className="relative group">
                      <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className={`${inputClass} pl-12 text-center tracking-[0.4em] text-lg font-bold`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {error && (
                      <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 flex items-start gap-2 text-left">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700 flex items-start gap-2 text-left">
                        <CheckCircle size={14} className="mt-0.5 shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full rounded-2xl bg-[#0f3d35] py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#0a2e28] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign in'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 transition uppercase tracking-widest"
                  >
                    Resend Code
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
            LabIntel · Secure Health Data · 2025
          </p>
        </div>
      </div>
    </div>
  );
}
