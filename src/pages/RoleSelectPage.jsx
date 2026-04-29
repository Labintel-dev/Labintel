import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, ClipboardList,
  Mail, Lock, Eye, EyeOff, AlertCircle, Stethoscope, CheckCircle, Smartphone, Calendar, ChevronDown
} from 'lucide-react';
import { Navbar } from './LandingPage';
import { authenticate, setUser, registerUser } from '../data/mockData';

const P = '#14453d';

/* ── Role definitions ────────────────────────────────────────────────────── */
const ROLES = [
  {
    id:    'patient',
    label: 'Patient Portal',
    icon:  User,
    path:  '/patient',
    desc:  'View results, book appointments, and manage your health records securely.',
    iconBg: '#e8f5f0',
    iconColor: P,
  },
  {
    id:    'admin',
    label: 'Admin Portal',
    icon:  ShieldCheck,
    path:  '/admin',
    desc:  'Oversee operations, manage staff, and access comprehensive analytics.',
    iconBg: '#e8f5f0',
    iconColor: P,
  },
  {
    id:    'staff',
    label: 'Lab Staff Portal',
    icon:  ClipboardList,
    path:  '/lab',
    desc:  'Process samples, update results, and coordinate with the diagnostics team.',
    iconBg: '#14453d',
    iconColor: '#ffffff',
  },
  {
    id:    'doctor',
    label: 'Doctor Portal',
    icon:  Stethoscope,
    path:  '/doctor',
    desc:  'View patient reports, track diagnosis history, and consult seamlessly.',
    iconBg: '#f0f5ff',
    iconColor: '#2563eb',
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   ROLE SELECT PAGE (Dropdown UI)
══════════════════════════════════════════════════════════════════════════ */
const RoleSelectPage = () => {
  const navigate = useNavigate();
  const [selectedRoleId, setSelectedRoleId] = useState(ROLES[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail]    = useState('');
  const [phone, setPhone]    = useState('');
  const [dob, setDob]      = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]    = useState('');
  const [success, setSuccess]  = useState('');
  const [loading, setLoading]  = useState(false);

  const selectedRole = ROLES.find(r => r.id === selectedRoleId);

  const handleRoleChange = (e) => {
    setSelectedRoleId(e.target.value);
    setMode('login');
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setDob('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // Simulating network

    if (mode === 'register') {
      const existing = authenticate(selectedRole.id, email);
      if (existing) {
        setError('Email is already registered. Please sign in instead.');
      } else {
        const createdUser = registerUser(name, email, phone, dob);
        setUser(createdUser);
        navigate(selectedRole.path);
      }
      setLoading(false);
      return;
    }

    if (mode === 'forgot') {
      setSuccess('If this email is registered, a password reset link has been sent. Check your inbox.');
      setTimeout(() => setMode('login'), 3500);
      setLoading(false);
      return;
    }

    // Login mode
    const authId = selectedRole.id === 'staff' ? 'staff' : selectedRole.id;
    const user = authenticate(authId, email);
    if (user) {
      setUser(user);
      navigate(selectedRole.path);
    } else {
      setError('Invalid credentials. Please check your email and password.');
    }
    setLoading(false);
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
            Securely sign in into your workspace.
          </p>
        </motion.div>

        {/* Main Interface Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 relative p-8 md:p-12 box-border"
        >
          <AnimatePresence mode="wait">
             <motion.div
               key={mode + selectedRole.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.25 }}
               className="w-full"
             >
                <div className="mb-8 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                       style={{ background: selectedRole.iconBg }}>
                    <selectedRole.icon size={28} style={{ color: selectedRole.iconColor }} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                    {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : `Welcome Back`}
                  </h2>
                  <p className="text-sm text-gray-500 max-w-[280px]">
                    {mode === 'register' ? 'Fill in your details below to get started.' : mode === 'forgot' ? 'Enter your email to receive a secure password reset link.' : selectedRole.desc}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Animated Dropdown for Role */}
                  <div className="relative z-20">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Roles</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full pl-10 pr-10 py-3 bg-gray-50 border ${isDropdownOpen ? 'border-[#14453d] ring-2 ring-[#14453d]/10' : 'border-gray-200'} rounded-xl text-sm text-gray-700 outline-none transition-all cursor-pointer font-semibold shadow-sm flex items-center justify-between text-left`}
                    >
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                         <selectedRole.icon size={16} />
                      </div>
                      <span className="truncate ml-1">{selectedRole.label}</span>
                      <motion.div
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      >
                         <ChevronDown size={16} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsDropdownOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20"
                            style={{ transformOrigin: 'top center' }}
                          >
                            {ROLES.map((role) => {
                              const isSelected = selectedRoleId === role.id;
                              return (
                                <motion.button
                                  type="button"
                                  key={role.id}
                                  onClick={() => { handleRoleChange({ target: { value: role.id } }); setIsDropdownOpen(false); }}
                                  whileHover={{ backgroundColor: '#f8faf9', x: 6 }}
                                  transition={{ ease: "easeInOut", duration: 0.2 }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${isSelected ? 'bg-[#e8f5f0]/40 font-bold text-[#14453d]' : 'text-gray-600 font-medium'}`}
                                >
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: role.iconBg }}>
                                    <role.icon size={14} style={{ color: role.iconColor }} />
                                  </div>
                                  <span className="text-sm">{role.label}</span>
                                  {isSelected && (
                                    <CheckCircle size={14} className="ml-auto text-[#14453d]" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Full Name</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Phone Number</label>
                          <div className="relative">
                            <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="tel" placeholder="(123) 456-7890" value={phone} onChange={e => setPhone(e.target.value)} required className={inputClass} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Date of Birth</label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="date" value={dob} onChange={e => setDob(e.target.value)} required 
                              className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all ${!dob ? 'text-gray-400' : 'text-gray-700'}`} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
                    </div>
                  </div>

                  {mode !== 'forgot' && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between mb-1.5 mt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
                        {mode === 'login' && (
                          <button type="button" onClick={() => setMode('forgot')} className="text-xs font-bold text-[#14453d] hover:underline">Forgot password?</button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showPw ? 'text' : 'password'} placeholder={mode === 'register' ? "Create a strong password" : "Enter your password"} value={password} onChange={e => setPassword(e.target.value)} required className={`${inputClass} pr-10`} />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPw ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                        <div className="flex items-start gap-2 text-rose-600 text-xs bg-rose-50 rounded-xl p-3 border border-rose-100">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
                        </div>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                        <div className="flex items-start gap-2 text-emerald-700 text-xs bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                          <CheckCircle size={14} className="shrink-0 mt-0.5" /><span>{success}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading} className="w-full py-3.5 mt-6 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0" style={{ background: P }}>
                    {loading ? (mode === 'login' ? 'Verifying...' : 'Processing...') : mode === 'register' ? 'Complete Registration' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In Securely'}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  {selectedRole.id === 'patient' && mode === 'login' && (
                    <p className="text-sm text-gray-500">
                      New patient? <button onClick={() => setMode('register')} className="font-bold text-[#14453d] hover:underline transition-all">Create an account</button>
                    </p>
                  )}
                  {mode !== 'login' && (
                    <button onClick={() => setMode('login')} className="text-sm font-bold text-[#14453d] hover:underline transition-all">Back to Login</button>
                  )}
                </div>
             </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
{/* add style tag for hide scrollbar in mobile */}
<style>{`
  .hide-scroll::-webkit-scrollbar {
    display: none;
  }
  .hide-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>
    </div>
  );
};

export default RoleSelectPage;
