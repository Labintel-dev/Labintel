import { motion } from 'framer-motion';
import { FlaskConical, ShieldCheck, FileText, TrendingUp } from 'lucide-react';

const features = [
  { icon: FileText,    text: 'View all your lab reports instantly' },
  { icon: TrendingUp,  text: 'Track health trends over time' },
  { icon: ShieldCheck, text: 'Secured with OTP authentication' },
];

export default function PatientLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero relative overflow-hidden">
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
            Sign in with your phone OTP to access your health reports
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

          <a
            href="/select-role"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all shadow-xl shadow-black/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            Continue with Phone OTP
          </a>

          <p className="text-center text-xs text-slate-500 mt-6">
            New patients can register and sign in using their phone number.
          </p>
        </motion.div>

        <p className="text-center text-xs text-slate-600 mt-6">
          LabIntel · Secure Health Data · 2025
        </p>
      </div>
    </div>
  );
}
