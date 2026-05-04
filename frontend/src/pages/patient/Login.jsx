import { motion } from 'framer-motion';
import { FlaskConical, ShieldCheck, FileText, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const features = [
  { icon: FileText,    text: 'View all your lab reports instantly' },
  { icon: TrendingUp,  text: 'Track health trends over time' },
  { icon: ShieldCheck, text: 'Secured with Google authentication' },
];

export default function PatientLogin() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-hero px-4 py-8">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-120px] left-[-120px] w-[450px] h-[450px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-teal shadow-2xl shadow-teal-500/40 mb-5">
            <FlaskConical size={38} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">LabIntel</h1>
          <p className="text-slate-400 mt-2 text-sm">Your personal health intelligence platform</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-1 text-center">Welcome</h2>
          <p className="text-slate-400 text-sm mb-8 text-center">
            Sign in with your Google account to access your health reports
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-teal-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Google Button */}
          <a
            href={`${API_URL}/auth/patient/google`}
            id="google-signin-btn"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all shadow-xl shadow-black/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          <p className="text-center text-xs text-slate-500 mt-6">
            New patients can also sign in with Google — your account is created automatically.
          </p>
        </motion.div>

        <p className="text-center text-xs text-slate-600 mt-6">
          LabIntel · Secure Health Data · 2025
        </p>
      </div>
    </div>
  );
}
