import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authService } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Button, Input, Skeleton } from '../../components/common';
import { FlaskConical, Lock } from 'lucide-react';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LabLogin({ slug }) {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [lab, setLab] = useState(null);
  const [labLoading, setLabLoading] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  // Fetch lab branding from slug
  useEffect(() => {
    const fetchLab = async () => {
      try {
        setLabLoading(true);
        const result = await authService.getLabBySlug(slug || 'testlab');
        setLab(result.data);
      } catch {
        // Use defaults on 404
      } finally {
        setLabLoading(false);
      }
    };
    fetchLab();
  }, [slug]);

  const primaryColor = lab?.primary_color || '#0d9488';

  const onSubmit = async (data) => {
    try {
      const result = await authService.staffLogin({ ...data, slug: slug || 'testlab' });
      setAuth(result.token, { ...result.user, full_name: result.user.full_name }, result.lab);
      navigate('dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Incorrect email or password.';
      addToast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Accent top bar */}
      <div className="fixed top-0 inset-x-0 h-1" style={{ background: primaryColor }} />
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-5 rounded-full blur-3xl" style={{ background: primaryColor }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
      >
        {/* Top accent line */}
        <div className="h-1" style={{ background: primaryColor }} />

        <div className="p-8">
          {/* Logo + Lab Name */}
          <div className="text-center mb-8">
            {labLoading ? (
              <>
                <Skeleton className="w-16 h-16 rounded-xl mx-auto mb-3" />
                <Skeleton className="h-5 w-40 mx-auto" />
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-lg"
                  style={{ background: primaryColor }}>
                  {lab?.logo_url
                    ? <img src={lab.logo_url} alt="Lab logo" className="w-12 h-12 object-contain rounded-xl" />
                    : <FlaskConical size={30} />
                  }
                </div>
                <h1 className="text-xl font-bold text-slate-800">{lab?.name || 'LabIntel'}</h1>
                <p className="text-sm text-slate-500 mt-0.5">Staff Portal</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              autoComplete="email"
              placeholder="you@lab.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <button
              type="submit"
              disabled={isSubmitting || labLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-sm"
              style={{ background: primaryColor }}
            >
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Lock size={15} />
              }
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Secure staff portal · LabIntel
          </p>
        </div>
      </motion.div>
    </div>
  );
}
