import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authService } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Input, Skeleton } from '../../components/common';
import {
  FlaskConical,
  Lock,
  ArrowLeft,
  UserRound,
  Microscope,
  BarChart3,
} from 'lucide-react';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const landingByRole = {
  receptionist: 'patients',
  technician: 'reports/new',
  manager: 'analytics',
  administrator: 'analytics',
};

const roleConfig = {
  receptionist: {
    label: 'Receptionist',
    icon: UserRound,
    color: 'from-blue-600 to-blue-700',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    accentColor: '#3b82f6',
  },
  technician: {
    label: 'Technician',
    icon: Microscope,
    color: 'from-emerald-600 to-teal-600',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    accentColor: '#10b981',
  },
  manager: {
    label: 'Manager',
    icon: BarChart3,
    color: 'from-violet-600 to-purple-600',
    textColor: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    accentColor: '#8b5cf6',
  },
};

export default function LabLogin({ slug }) {
  const { role: urlRole } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [lab, setLab] = useState(null);
  const [labLoading, setLabLoading] = useState(true);

  // Validate the role from URL, default to 'manager' if invalid
  const selectedRole = ['receptionist', 'technician', 'manager'].includes(urlRole)
    ? urlRole
    : 'manager';

  const config = roleConfig[selectedRole];
  const RoleIcon = config.icon;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

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
  const currentSlug = slug || 'testlab';

  const onSubmit = async (data) => {
    try {
      const result = await authService.staffLogin({ ...data, role: selectedRole, slug: slug || 'testlab' });
      setAuth(result.token, { ...result.user, full_name: result.user.full_name }, result.lab);
      const labSlug = result.lab?.slug || slug || 'testlab';
      const landing = landingByRole[result.user?.role] || 'dashboard';
      navigate(`/lab/${labSlug}/${landing}`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Incorrect email or password.';
      addToast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Accent top bar using role color */}
      <div
        className="fixed top-0 inset-x-0 h-1"
        style={{ background: `linear-gradient(90deg, ${config.accentColor}, ${primaryColor})` }}
      />

      {/* Background blobs */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] opacity-5 rounded-full blur-3xl"
        style={{ background: config.accentColor }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-5 rounded-full blur-3xl"
        style={{ background: primaryColor }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
      >
        {/* Top accent gradient */}
        <div
          className={`h-1.5 bg-gradient-to-r ${config.color}`}
        />

        <div className="p-8">
          {/* Back button */}
          <Link
            to={`/lab/${currentSlug}/login`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6 group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Change role</span>
          </Link>

          {/* Logo + Lab Name */}
          <div className="text-center mb-6">
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

          {/* Role Badge */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${config.bgColor} border ${config.borderColor} mb-5`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-sm`}>
              <RoleIcon size={20} />
            </div>
            <div>
              <p className={`text-sm font-bold ${config.textColor}`}>
                {config.label} Login
              </p>
              <p className="text-xs text-slate-500">
                Signing in as {config.label.toLowerCase()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              autoComplete="email"

              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"

              {...register('password')}
              error={errors.password?.message}
            />


            <button
              type="submit"
              disabled={isSubmitting || labLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-sm bg-gradient-to-r ${config.color}`}
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
