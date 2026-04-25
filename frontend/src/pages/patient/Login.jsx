import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authService } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { FlaskConical, Mail, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function PatientLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      // Re-use the staff login endpoint — the JWT will carry the role
      const result = await authService.staffLogin({ ...data, slug: null });
      setAuth(result.token, { ...result.user, role: result.user?.role || 'patient' }, result.lab ?? null);
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Incorrect email or password.';
      addToast(msg, 'error');
    }
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
          <h2 className="text-xl font-bold text-white mb-1 text-center">Welcome Back</h2>
          <p className="text-slate-400 text-sm mb-8 text-center">Securely connect with Google to view your reports</p>

          <a 
            href={`${API_URL}/auth/patient/google`}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 transition-all shadow-lg hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </a>

          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0f172a] px-2 text-slate-400">or use email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <div className={`flex items-center border-2 rounded-xl bg-white/10 transition-all overflow-hidden ${errors.email ? 'border-red-400' : 'border-white/20 focus-within:border-teal-400'}`}>
                <div className="flex items-center gap-2 px-4 py-3 border-r border-white/20">
                  <Mail size={16} className="text-teal-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className={`flex items-center border-2 rounded-xl bg-white/10 transition-all overflow-hidden ${errors.password ? 'border-red-400' : 'border-white/20 focus-within:border-teal-400'}`}>
                <div className="flex items-center gap-2 px-4 py-3 border-r border-white/20">
                  <Lock size={16} className="text-teal-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-teal hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-teal-700/30 mt-2"
            >
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : null
              }
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-slate-500 mt-6">
          LabIntel · Secure Health Data · 2025
        </p>
      </div>
    </div>
  );
}
