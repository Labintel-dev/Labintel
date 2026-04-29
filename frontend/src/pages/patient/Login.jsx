import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authService } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { FlaskConical, Phone, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const otpSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
});

const otpVerifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export default function PatientLogin() {
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [otpSent, setOtpSent] = useState(false);
  const [otpPhoneNumber, setOtpPhoneNumber] = useState('');

  // Clear auth on mount to logout OTP sessions on page reload
  useEffect(() => {
    const authStore = useAuthStore.getState();
    if (authStore.isOtpSession) {
      clearAuth();
    }
  }, [clearAuth]);

  const otpForm = useForm({ resolver: zodResolver(otpSchema) });
  const otpVerifyForm = useForm({ resolver: zodResolver(otpVerifySchema) });

  const onOtpSendSubmit = async (data) => {
    try {
      await authService.sendOtp(data.phone);
      setOtpPhoneNumber(data.phone);
      setOtpSent(true);
      addToast('OTP sent! Use 123456 for testing.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to send OTP. Please try again.';
      addToast(msg, 'error');
    }
  };

  const onOtpVerifySubmit = async (data) => {
    try {
      const result = await authService.verifyOtp(otpPhoneNumber, data.otp);
      // Set auth with isOtpSession = true (will be cleared on page refresh)
      setAuth(result.token, result.patient, null, true);
      addToast(`Welcome, ${result.patient.full_name || 'Patient'}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Invalid OTP. Please try again.';
      addToast(msg, 'error');
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    otpForm.reset();
    otpVerifyForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-teal shadow-xl shadow-teal-500/30 mb-4">
            <FlaskConical size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">LabIntel</h1>
          <p className="text-slate-400 mt-1">Your health reports, everywhere</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl"
        >
          {!otpSent ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1 text-center">Sign In with OTP</h2>
              <p className="text-slate-400 text-sm mb-8 text-center">Enter your phone number to receive an OTP</p>

              <form onSubmit={otpForm.handleSubmit(onOtpSendSubmit)} className="space-y-4">
                <div>
                  <div className={`flex items-center border-2 rounded-xl bg-white/10 transition-all overflow-hidden ${otpForm.formState.errors.phone ? 'border-red-400' : 'border-white/20 focus-within:border-teal-400'}`}>
                    <div className="flex items-center gap-2 px-4 py-3 border-r border-white/20">
                      <Phone size={16} className="text-teal-400" />
                    </div>
                    <input
                      {...otpForm.register('phone')}
                      type="tel"
                      placeholder="9876543210"
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none text-sm"
                    />
                  </div>
                  {otpForm.formState.errors.phone && <p className="mt-1 text-xs text-red-400">{otpForm.formState.errors.phone.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={otpForm.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-teal hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-teal-700/30 mt-4"
                >
                  {otpForm.formState.isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <ArrowLeft size={18} className="text-teal-400" />
                </button>
                <h2 className="text-xl font-bold text-white">Enter OTP</h2>
              </div>
              <p className="text-slate-400 text-sm mb-8 text-center">
                We sent a code to <span className="text-white font-semibold">{otpPhoneNumber}</span>
                <br />
                <span className="text-xs text-slate-500">Use 123456 for testing</span>
              </p>

              <form onSubmit={otpVerifyForm.handleSubmit(onOtpVerifySubmit)} className="space-y-4">
                <div>
                  <input
                    {...otpVerifyForm.register('otp')}
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    className={`w-full text-center text-2xl tracking-widest font-bold py-4 rounded-xl bg-white/10 border-2 transition-all text-white placeholder:text-slate-600 focus:outline-none ${otpVerifyForm.formState.errors.otp ? 'border-red-400' : 'border-white/20 focus:border-teal-400'}`}
                  />
                  {otpVerifyForm.formState.errors.otp && <p className="mt-2 text-xs text-red-400 text-center">{otpVerifyForm.formState.errors.otp.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={otpVerifyForm.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-teal hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-teal-700/30 mt-4"
                >
                  {otpVerifyForm.formState.isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>

        <p className="text-center text-xs text-slate-500 mt-6">
          LabIntel · Secure Health Data · 2025
        </p>
      </div>
    </div>
  );
}
