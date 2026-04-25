import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../../services/reportService';
import { Skeleton } from '../../components/common';
import {
  FlaskConical,
  UserRound,
  Microscope,
  BarChart3,
  ChevronRight,
  Shield,
} from 'lucide-react';

const roles = [
  {
    id: 'receptionist',
    label: 'Receptionist Portal',
    subtitle: 'Click to continue as Receptionist.',
    description: 'Manage patient registrations, appointments, and front-desk operations.',
    icon: UserRound,
    gradient: 'from-blue-600 to-blue-700',
    hoverGradient: 'from-blue-700 to-blue-800',
    shadow: 'shadow-blue-500/25',
    iconBg: 'bg-blue-500/20',
    borderAccent: 'border-blue-500/20',
    glowColor: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'technician',
    label: 'Technician Portal',
    subtitle: 'Click to continue as Technician.',
    description: 'Enter test results, manage reports, and handle lab samples.',
    icon: Microscope,
    gradient: 'from-emerald-600 to-teal-600',
    hoverGradient: 'from-emerald-700 to-teal-700',
    shadow: 'shadow-emerald-500/25',
    iconBg: 'bg-emerald-500/20',
    borderAccent: 'border-emerald-500/20',
    glowColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'manager',
    label: 'Manager Portal',
    subtitle: 'Click to continue as Manager.',
    description: 'Analytics, settings, staff management, and report approvals.',
    icon: BarChart3,
    gradient: 'from-violet-600 to-purple-600',
    hoverGradient: 'from-violet-700 to-purple-700',
    shadow: 'shadow-violet-500/25',
    iconBg: 'bg-violet-500/20',
    borderAccent: 'border-violet-500/20',
    glowColor: 'rgba(139, 92, 246, 0.15)',
  },
];

export default function RoleSelect({ slug }) {
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [labLoading, setLabLoading] = useState(true);
  const [hoveredRole, setHoveredRole] = useState(null);

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

  const handleRoleClick = (roleId) => {
    navigate(`/lab/${currentSlug}/login/${roleId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Accent top bar */}
      <div className="fixed top-0 inset-x-0 h-1 z-50" style={{ background: primaryColor }} />

      {/* Background decorative elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
      <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-15%] left-[30%] w-[500px] h-[500px] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />

      {/* Header */}
      <header className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            {labLoading ? (
              <Skeleton className="w-12 h-12 rounded-xl" />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ background: primaryColor }}
              >
                {lab?.logo_url ? (
                  <img src={lab.logo_url} alt="Lab logo" className="w-8 h-8 object-contain rounded-lg" />
                ) : (
                  <FlaskConical size={24} />
                )}
              </div>
            )}
            <div>
              {labLoading ? (
                <Skeleton className="h-5 w-36" />
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-800">{lab?.name || 'LabIntel'}</h2>
                  <p className="text-xs text-slate-500">Staff Portal</p>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-xs text-slate-400"
          >
            <Shield size={14} />
            <span>Secure Access</span>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
            Welcome to{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              }}
            >
              {lab?.name || 'LabIntel'}
            </span>
          </h1>
          <p className="text-base text-slate-500 max-w-md mx-auto">
            Select your role to access the staff portal
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isHovered = hoveredRole === role.id;

            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                onClick={() => handleRoleClick(role.id)}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
                className={`
                  group relative bg-gradient-to-br ${role.gradient}
                  rounded-2xl p-6 text-left text-white
                  transition-all duration-300 ease-out
                  hover:scale-[1.03] hover:${role.shadow}
                  shadow-lg cursor-pointer
                  overflow-hidden
                `}
                style={{
                  boxShadow: isHovered
                    ? `0 20px 40px -12px ${role.glowColor}, 0 8px 20px -8px rgba(0,0,0,0.15)`
                    : '0 4px 16px -4px rgba(0,0,0,0.1)',
                }}
              >
                {/* Decorative circle */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full transition-transform duration-500 group-hover:scale-150" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full transition-transform duration-500 group-hover:scale-150" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 ${role.iconBg} rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon size={28} className="text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold mb-1">{role.label}</h3>
                  <p className="text-sm text-white/70 mb-3">{role.subtitle}</p>

                  {/* Description */}
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    {role.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                    <span>Continue</span>
                    <ChevronRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Info section below cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <p className="text-xs text-slate-400">
            Having trouble logging in? Contact your lab administrator for assistance.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 border-t border-slate-100 bg-white/30 backdrop-blur-sm">
        © {new Date().getFullYear()} LabIntel Technologies · Secure Staff Portal
      </footer>
    </div>
  );
}
