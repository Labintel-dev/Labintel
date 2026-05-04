import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimation, useInView } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, CheckCircle2, Clock, Mail, ShieldCheck, Sparkles, Star, Stethoscope,
  Users, Microscope, Heart, FlaskConical, Pill,
  Dna, Search, Download, Upload, FileImage, FileText,
  Award, TestTube, Plus, ChevronDown, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthStore } from '../store/authStore.js';

/* ── Design tokens ───────────────────────────────────────────────────────── */
const P  = '#14453d';   // primary dark teal
const PL = '#1a5a4f';   // primary lighter
const BG = '#f9fafb';   // light background

/* ── Shared animated section wrapper ────────────────────────────────────── */
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true, margin: '-60px' });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) controls.start({ opacity: 1, y: 0 });
  }, [inView, controls]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }}
                animate={controls} transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
                className={className}>
      {children}
    </motion.div>
  );
};

const LandingProfileDropdown = ({ user, onClose, onUpdateProfile, onMyReports, onLogout }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl z-[70]"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
    >
      <div className="border-b border-gray-100 bg-[#f8faf9] p-5">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm" style={{ background: P }}>
              {user.avatar}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-gray-800">{user.name}</div>
            <div className="truncate text-xs font-medium text-gray-400">{user.email}</div>
            <span className="mt-2 inline-flex rounded-full bg-[#e8f5f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#14453d]">
              {user.role || 'patient'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-2">
        <button onClick={onUpdateProfile} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-gray-600 transition-all hover:bg-gray-50 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-all group-hover:bg-white">
            <Settings size={16} />
          </div>
          <span className="text-sm font-semibold">Update Profile</span>
        </button>

        <button onClick={onMyReports} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-gray-600 transition-all hover:bg-gray-50 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5f0] text-[#14453d] transition-all group-hover:bg-white">
            <FileText size={16} />
          </div>
          <span className="text-sm font-semibold">My Reports</span>
        </button>

        <div className="mx-2 my-2 h-px bg-gray-50" />

        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-rose-500 transition-all hover:bg-rose-50 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 transition-all group-hover:bg-white">
            <LogOut size={16} />
          </div>
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

/* ── Navbar (shared with RoleSelectPage) ─────────────────────────────────── */
export const Navbar = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const { user: supabaseUser, signOut: supabaseSignOut } = useAuth();
  const authStoreUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [activeSection, setActiveSection] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  let user = null;
  if (authStoreUser) {
    user = {
      id: authStoreUser.id,
      name: authStoreUser.full_name || authStoreUser.email?.split('@')[0] || authStoreUser.phone || 'User',
      email: authStoreUser.email || authStoreUser.phone || '',
      role: authStoreUser.role || 'patient',
      avatar_url: authStoreUser.avatar_url || null,
      avatar: (authStoreUser.full_name || authStoreUser.email || 'U').charAt(0).toUpperCase()
    };
  } else if (supabaseUser) {
    user = supabaseUser;
  }

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['partners', 'services', 'book', 'reports', 'contact'];
      let current = "";
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 150) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: 'partners', label: 'Partners' },
    { id: 'services', label: 'Services' },
    { id: 'reports', label: 'Reports' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleUpdateProfile = () => {
    setIsProfileOpen(false);
    navigate('/patient?profile=update');
  };

  const handleMyReports = () => {
    setIsProfileOpen(false);
    navigate('/patient');
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    clearAuth();
    if (supabaseUser) {
      await supabaseSignOut();
    }
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="LabIntel Logo" className="w-9 h-9 rounded-xl object-contain" />
          <span className="text-lg font-bold tracking-tight" style={{ color: P }}>
            LabIntel
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map(link => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`relative px-4 py-2 text-sm font-semibold transition-colors cursor-pointer rounded-full ${
                activeSection === link.id ? 'text-[#14453d]' : 'text-gray-500 hover:text-[#14453d]'
              }`}
            >
              {activeSection === link.id && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-[#e8f5f0] rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen((open) => !open)}
                className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 transition-all hover:border-[#14453d]/20 hover:bg-gray-50"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-100 bg-gray-100">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white" style={{ background: P }}>
                      {user.avatar}
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="max-w-[140px] truncate text-sm font-bold text-gray-800">{user.name}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Patient</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <LandingProfileDropdown
                    user={user}
                    onClose={() => setIsProfileOpen(false)}
                    onUpdateProfile={handleUpdateProfile}
                    onMyReports={handleMyReports}
                    onLogout={handleLogout}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLoginClick || (() => navigate('/select-role'))}
              className="text-white text-sm font-semibold px-5 py-2 rounded-full transition-all"
              style={{ background: P }}
            >
              Login
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
};

/* ── Service card data ──────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: Microscope,
    title: 'Blood Tests',
    desc: 'Complete blood count, metabolic panels, lipid profiles and more.',
    badge: 'MOST POPULAR',
    badgeColor: '#14453d',
  },
  {
    icon: Dna,
    title: 'Genetic Testing',
    desc: 'DNA analysis, hereditary screening, pharmacogenomics.',
    badge: null,
  },
  {
    icon: Heart,
    title: 'Cardiac Panel',
    desc: 'Troponin, BNP, CRP and comprehensive heart health markers.',
    badge: null,
  },
  {
    icon: FlaskConical,
    title: 'Hormonal Assays',
    desc: 'Thyroid function, cortisol, insulin, and reproductive hormones.',
    badge: null,
  },
  {
    icon: TestTube,
    title: 'Microbiology',
    desc: 'Culture & sensitivity, pathogen identification, antibiogram.',
    badge: 'NEW',
    badgeColor: '#0d9488',
  },
  {
    icon: Pill,
    title: 'Health Packages',
    desc: 'Curated wellness panels for preventive and executive checkups.',
    badge: null,
  },
];

const CLIENTS = [
  { name: 'Aster Hospitals', accent: '#f59e0b' },
  { name: 'Fortis Care', accent: '#22c55e' },
  { name: 'MedGenome', accent: '#38bdf8' },
  { name: 'Manipal Clinics', accent: '#c084fc' },
  { name: 'Cloudnine Health', accent: '#fb7185' },
  { name: 'Max Lab', accent: '#7dd3fc' },
];

const DIAGNOSTIC_CHALLENGES = [
  {
    title: 'For Labs',
    icon: FlaskConical,
    cta: 'See lab solutions',
    points: [
      'High volume of patient support calls asking for interpretation',
      'Reports with medical jargon that confuse patients',
      'No standardized way to deliver insights with reports',
    ],
  },
  {
    title: 'For Patients',
    icon: Heart,
    cta: 'Try a sample report',
    points: [
      'Confused by technical terminology and reference ranges',
      'Uncertain about what results mean for their health',
      'No guidance on next steps or lifestyle recommendations',
    ],
  },
];

const REPORT_COMPARISON = {
  traditional: [
    { label: 'Hemoglobin', value: '13.2 g/dL', range: 'Range: 12.0-15.5' },
    { label: 'WBC', value: '7.2 x 10^3/uL', range: 'Range: 4.5-11.0' },
    { label: 'Glucose', value: '98 mg/dL', range: 'Range: 70-100' },
  ],
  advantages: [
    'Patient-friendly readability',
    'AI-generated plain-language insights',
    'Suggested next steps after every report',
    'Localized language support for broader access',
    'White-label delivery for partner labs',
    'Engagement analytics and usage visibility',
  ],
  smart: [
    { title: 'Hemoglobin: Normal', note: 'Oxygen-carrying capacity looks healthy', tone: 'green' },
    { title: 'WBC: Normal', note: 'Immune system markers are within range', tone: 'green' },
    { title: 'Blood Sugar: Watch', note: 'Repeat after 3 months with lifestyle tracking', tone: 'amber' },
  ],
};

const SPECIALISED_DOCTORS = [
  {
    name: 'Dr. Nitish Naik',
    degree: 'MBBS, MD, DM - Cardiology',
    specialization: 'Cardiologist',
    role: 'Supports cardiac diagnostics, preventive heart-risk analysis, and clearer patient report communication.',
    rating: 4.9,
    review: 'Patients respond better when cardiac markers are explained in simple language with practical next steps.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/62/The_President%2C_Shri_Pranab_Mukherjee_presenting_the_Padma_Shri_Award_to_Dr._Nitish_Naik%2C_at_an_Investiture_Ceremony-II%2C_at_Rashtrapati_Bhavan%2C_in_New_Delhi_on_April_26%2C_2014.jpg',
  },
  {
    name: 'Dr. Ambrish Mithal',
    degree: 'MBBS, MD, DM - Endocrinology',
    specialization: 'Diabetologist',
    role: 'Guides diabetes, thyroid, and metabolic-health patients through clearer lab interpretations.',
    rating: 4.8,
    review: 'When reports are translated into plain terms, patients arrive better prepared and more confident about treatment.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Ambrish_Mittal_%28cropped%29.jpg',
  },
  {
    name: 'Dr. Randeep Guleria',
    degree: 'MBBS, MD, DM - Pulmonary Medicine',
    specialization: 'Pulmonologist',
    role: 'Helps patients interpret respiratory diagnostics, lung-risk indicators, and follow-up care pathways.',
    rating: 4.9,
    review: 'A well-structured report reduces confusion for respiratory patients and helps them act earlier on warning signs.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Dr._Randeep_Guleria.jpg',
  },
  {
    name: 'Dr. Pradeep Chowbey',
    degree: 'MS, FRCS, FAMS',
    specialization: 'GI & Minimal Access Surgeon',
    role: 'Uses structured reports and imaging context to support surgical planning and specialist referrals.',
    rating: 4.7,
    review: 'Patients respond better when diagnostic information is visual, precise, and easy to connect with treatment plans.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Profile-pic.jpg',
  },
];

/* ── Landing Page Component ────────────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: '#f8faf9' }}>
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              {/* NABL Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-[#e8f5f0] border border-[#c5e6d8]
                           text-[#14453d] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase"
              >
                <Award size={14} />
                NABL Accredited Laboratory
              </motion.div>

              {/* Headline */}
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                         className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 mb-6">
                Precision Diagnostics,<br />
                <span className="italic" style={{ color: P }}>Human Care.</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.22 }}
                        className="text-gray-500 text-base leading-relaxed mb-8 max-w-lg">
                Advanced pathology and diagnostics trusted by over 50,000
                patients. Fast, accurate results with a compassionate approach to
                healthcare.
              </motion.p>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.32 }}
                          className="flex items-center gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 text-white font-semibold text-sm
                             px-6 py-3 rounded-full transition-all"
                  style={{ background: P }}
                >
                  Book a Test <ArrowRight size={15} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/select-role')}
                  className="flex items-center gap-2 font-semibold text-sm
                             px-6 py-3 rounded-full border-2 transition-all"
                  style={{ borderColor: P, color: P }}
                >
                  Patient Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-2 border border-[#d0e2db] bg-white/90 text-sm font-semibold
                             px-6 py-3 rounded-full text-gray-700 transition-all shadow-sm"
                >
                  Preview AI Report
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center gap-6 mt-10 flex-wrap">
                {[
                  { icon: Clock, label: 'Results in 24hrs' },
                  { icon: ShieldCheck, label: 'ISO 15189 Certified' },
                  { icon: Users, label: '50,000+ Patients' },
                ].map(t => (
                  <div key={t.label} className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <t.icon size={14} className="text-[#14453d]" />
                    {t.label}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Hero image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl"
                   style={{ boxShadow: '0 20px 60px rgba(20,69,61,0.15)' }}>
                <img
                  src="/lab-hero.png"
                  alt="Modern pathology laboratory"
                  className="w-full h-80 md:h-[420px] object-cover"
                />
              </div>

              {/* Floating card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-4 -left-4 md:-left-6 bg-white rounded-xl
                           shadow-lg px-4 py-3 flex items-center gap-3 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                     style={{ background: P }}>
                  <TestTube size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">500+ Tests</div>
                  <div className="text-xs text-gray-400">Available daily</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PARTNER LABS ───────────────────────────────────────────────── */}
      <section id="partners" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: P }}>
              Trusted Network
            </p>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-3">
              Powered by Premium Laboratories
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
              We aggregate results across our network of accredited laboratory partners to bring you the best in diagnostic accuracy.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Apollo Diagnostics', desc: 'Precision Pathology & Full Body Checkups', tag: 'Core Partner', color: '#16a34a', href: 'https://apollodiagnostics.in' },
              { name: 'Dr. Lal PathLabs', desc: 'Advanced Molecular Diagnostics & Genetics', tag: 'Specialist', color: '#0ea5e9', href: 'https://www.lalpathlabs.com' },
              { name: 'Metropolis', desc: 'Specialized Hormonal & Assays', tag: 'NABL Certified', color: '#eab308', href: 'https://www.metropolisindia.com' },
              { name: 'Thyrocare', desc: 'Preventive Healthcare & Thyroid Profiles', tag: 'Automation', color: '#f43f5e', href: 'https://www.thyrocare.com' },
            ].map((lab, i) => (
              <FadeUp key={lab.name} delay={0.1 + i * 0.1}>
                <motion.a
                  href={lab.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(20,69,61,0.08)' }}
                  className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col h-full items-center text-center transition-all shadow-sm block cursor-pointer group hover:border-gray-200"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 shadow-sm relative overflow-hidden bg-gray-50 transition-transform group-hover:scale-105">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: lab.color }}></div>
                    <span className="text-2xl font-black" style={{ color: lab.color }}>{lab.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-2 transition-colors group-hover:text-gray-900">{lab.name}</h3>
                  <p className="text-xs text-gray-500 mb-5 flex-1">{lab.desc}</p>
                  <span className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest transition-colors scale-100"
                        style={{ color: lab.color, backgroundColor: `${lab.color}15` }}>
                    {lab.tag}
                  </span>
                </motion.a>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.2} className="mt-14">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.32em] mb-3 text-gray-400">
                Trusted by Leading Care Networks
              </p>
              <h3 className="text-3xl font-extrabold text-gray-900">
                Our Clients
              </h3>
            </div>

            <div className="client-marquee-shell">
              <div className="client-marquee-track">
                {[...CLIENTS, ...CLIENTS].map((client, index) => (
                  <div
                    key={`${client.name}-${index}`}
                    className="client-marquee-card"
                    style={{
                      '--client-accent': client.accent,
                    }}
                  >
                    <div className="client-marquee-logo">
                      <span className="client-marquee-mark">{client.name.slice(0, 2).toUpperCase()}</span>
                      <div className="client-marquee-copy">
                        <span className="client-marquee-name">{client.name}</span>
                        <span className="client-marquee-subtitle">Clinical Partner</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.25} className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                What's Broken in Diagnostics Today?
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {DIAGNOSTIC_CHALLENGES.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.55, delay: 0.08 * index }}
                  whileHover={{ y: -4, boxShadow: '0 24px 50px rgba(59, 130, 246, 0.10)' }}
                  className="rounded-[2rem] border border-[#bfd6ff] bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-8 md:p-10 shadow-[0_18px_40px_rgba(148,163,184,0.10)]"
                >
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-12 h-12 rounded-2xl bg-[#dbeafe] flex items-center justify-center text-[#2563eb]">
                      <item.icon size={22} />
                    </div>
                    <h4 className="text-3xl font-extrabold text-[#2563eb]">
                      {item.title}
                    </h4>
                  </div>

                  <div className="space-y-5 mb-8">
                    {item.points.map((point) => (
                      <div key={point} className="flex items-start gap-4 text-left">
                        <span className="mt-2.5 w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0"></span>
                        <p className="text-[1.05rem] leading-9 text-slate-600">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full rounded-xl border border-[#6ea0ff] bg-[linear-gradient(180deg,#cfe1ff_0%,#bad4ff_100%)] px-6 py-4 text-base font-bold text-[#2448b8] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.cta}
                      <ArrowRight size={18} />
                    </span>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.28} className="mt-20">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5f7497] mb-3">
                Report Experience
              </p>
              <h3
                className="text-4xl md:text-5xl text-slate-900 mb-4"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
              >
                Reports Your Patients Can Actually Follow
              </h3>
              <p
                className="text-lg text-slate-500 leading-8"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                We turn dense pathology language into clear summaries, visual cues, and practical next steps without losing clinical accuracy.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(248, 113, 113, 0.10)' }}
                className="rounded-[2rem] border border-[#f8b4b4] bg-white p-7 md:p-8 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#fff1f1] flex items-center justify-center text-[#ef4444]">
                    <AlertTriangle size={22} />
                  </div>
                  <h4
                    className="text-[2rem] text-slate-900"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
                  >
                    Traditional Report
                  </h4>
                </div>

                <div className="space-y-8">
                  {REPORT_COMPARISON.traditional.map((item) => (
                    <div key={item.label}>
                      <p className="text-[1.05rem] font-extrabold text-slate-900 mb-1">{item.label}:</p>
                      <p className="text-[2rem] leading-none text-slate-800 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        {item.value}
                      </p>
                      <p className="text-base text-slate-400">{item.range}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl bg-[linear-gradient(90deg,#fff1f1_0%,#ffe0e0_100%)] px-5 py-4 text-[#dc2626] text-base font-semibold">
                  Dense terminology, little context, and no guidance.
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(96, 165, 250, 0.12)' }}
                className="rounded-[2rem] border border-[#9ec5ff] bg-[linear-gradient(180deg,#eef6ff_0%,#dbeafe_100%)] p-7 md:p-8 shadow-[0_18px_42px_rgba(59,130,246,0.10)]"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center text-[#2563eb] border border-[#bfdbfe]">
                    <Sparkles size={21} />
                  </div>
                  <h4
                    className="text-[2rem] text-slate-900"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
                  >
                    Why LabIntel
                  </h4>
                </div>

                <div className="space-y-5 mb-8">
                  {REPORT_COMPARISON.advantages.map((item) => (
                    <div key={item} className="flex items-start gap-4">
                      <CheckCircle2 size={25} className="text-[#22c55e] mt-0.5 shrink-0" />
                      <p className="text-[1.12rem] leading-8 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/select-role')}
                  className="w-full rounded-2xl bg-[linear-gradient(90deg,#2563eb_0%,#3b82f6_100%)] px-6 py-4 text-white text-lg font-bold shadow-[0_16px_30px_rgba(37,99,235,0.28)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span className="inline-flex items-center gap-2">
                    Get Started
                    <ArrowRight size={18} />
                  </span>
                </motion.button>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(34, 197, 94, 0.10)' }}
                className="rounded-[2rem] border border-[#9ae6b4] bg-white p-7 md:p-8 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#ecfdf3] flex items-center justify-center text-[#22c55e]">
                    <CheckCircle2 size={22} />
                  </div>
                  <h4
                    className="text-[2rem] text-slate-900"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
                  >
                    Smart Report
                  </h4>
                </div>

                <div className="space-y-6">
                  {REPORT_COMPARISON.smart.map((item) => (
                    <div
                      key={item.title}
                      className={`rounded-2xl px-5 py-4 border ${
                        item.tone === 'green'
                          ? 'bg-[linear-gradient(90deg,#ebfbf2_0%,#e0f7ea_100%)] border-[#d1fadf]'
                          : 'bg-[linear-gradient(90deg,#fff7e9_0%,#fff3d9_100%)] border-[#fde7b0]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {item.tone === 'green' ? (
                          <CheckCircle2 size={22} className="text-[#22c55e] mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle size={22} className="text-[#f59e0b] mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p
                            className={`text-[1.05rem] font-extrabold ${
                              item.tone === 'green' ? 'text-[#15803d]' : 'text-[#b45309]'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-base mt-1 text-slate-600">{item.note}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-[#a7f3c0] bg-[linear-gradient(90deg,#effdf4_0%,#e3faed_100%)] px-5 py-4 text-[#166534] text-base font-semibold">
                  Clear language, visual markers, and actionable guidance for every patient.
                </div>
              </motion.div>
            </div>
          </FadeUp>

          <FadeUp delay={0.32} className="mt-24">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7c8aa5] mb-3">
                Medical Leadership
              </p>
              <h3
                className="text-4xl md:text-5xl text-slate-900 mb-4"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
              >
                Specialised Doctors
              </h3>
              <p className="text-lg text-slate-500 leading-8">
                Experienced clinicians across key specialties trust structured, patient-friendly reporting to support better care conversations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {SPECIALISED_DOCTORS.map((doctor, index) => (
                <motion.div
                  key={doctor.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.45, delay: 0.06 * index }}
                  whileHover={{ y: -6, boxShadow: '0 24px 48px rgba(15, 23, 42, 0.10)' }}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
                >
                  <div className="relative">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="h-72 w-full object-cover object-top bg-slate-100"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,23,42,0.78)_100%)]"></div>
                    <div className="absolute left-5 bottom-5 flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 shadow-sm">
                      <Star size={15} className="fill-[#f59e0b] text-[#f59e0b]" />
                      <span className="text-sm font-bold text-slate-800">{doctor.rating}</span>
                      <span className="text-xs text-slate-500">Doctor Rating</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h4
                          className="text-[1.55rem] text-slate-900"
                          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
                        >
                          {doctor.name}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">{doctor.degree}</p>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-[#e7f1ff] flex items-center justify-center text-[#2563eb] shrink-0">
                        <Stethoscope size={20} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eef6ff] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">
                        {doctor.specialization}
                      </span>
                    </div>

                    <p className="text-[0.98rem] leading-7 text-slate-600 mb-5">
                      {doctor.role}
                    </p>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                        Review
                      </p>
                      <p className="text-[0.98rem] leading-7 text-slate-600">
                        "{doctor.review}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────────────── */}
      <section id="services" className="py-20" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: P }}>
              Our Testing Services
            </p>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-3">
              Comprehensive Testing Across All Disciplines
            </h2>
            <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
              Comprehensive testing across all major pathology disciplines
              with state-of-the-art equipment and expert analysis.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => (
              <FadeUp key={s.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(20,69,61,0.08)' }}
                  className="relative bg-white rounded-2xl border border-gray-200 p-6 h-full
                             cursor-default transition-all"
                >
                  {/* Badge */}
                  {s.badge && (
                    <span className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1
                                     rounded-full text-white"
                          style={{ background: s.badgeColor }}>
                      {s.badge}
                    </span>
                  )}

                  <div className="w-11 h-11 bg-[#e8f5f0] rounded-xl flex items-center justify-center mb-4">
                    <s.icon size={20} style={{ color: P }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>


      {/* ── DOWNLOAD REPORTS ───────────────────────────────────────────── */}
      {/* ── BOOK A TEST ────────────────────────────────────────────────── */}
      <section id="book" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp className="max-w-4xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-3 text-center"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Upload Your Report
            </h2>
            <p className="text-gray-500 text-base text-center mb-10 max-w-2xl mx-auto leading-8">
              Submit your lab report securely for fast review. Upload a clear photo or a PDF and let LabIntel turn complex findings into easier-to-understand insights.
            </p>

            <div
              className="bg-white rounded-[2rem] border border-gray-200 p-6 md:p-8"
              style={{ boxShadow: '0 18px 45px rgba(20,69,61,0.08)' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <label className="group cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only" />
                  <div className="h-full rounded-2xl border border-[#cfe0db] bg-[#f8fbfa] p-6 transition-all group-hover:border-[#14453d] group-hover:bg-white">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#e8f5f0', color: P }}>
                      <FileImage size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                      Upload Photo
                    </h3>
                    <p className="text-sm text-gray-500 leading-7 mb-5">
                      Add a clear photo from your phone or camera. Best for printed reports, prescriptions, or lab snapshots.
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: P }}>
                      <Upload size={16} />
                      Choose image
                    </div>
                  </div>
                </label>

                <label className="group cursor-pointer">
                  <input type="file" accept="application/pdf" className="sr-only" />
                  <div className="h-full rounded-2xl border border-[#cfe0db] bg-[#f8fbfa] p-6 transition-all group-hover:border-[#14453d] group-hover:bg-white">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#e8f5f0', color: P }}>
                      <FileText size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                      Upload PDF
                    </h3>
                    <p className="text-sm text-gray-500 leading-7 mb-5">
                      Send your digital report in PDF format for cleaner parsing, faster review, and better readability.
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: P }}>
                      <Upload size={16} />
                      Choose PDF
                    </div>
                  </div>
                </label>
              </div>

              <div className="rounded-2xl border border-[#d7e5e0] bg-[#fbfcfc] p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: P }}>
                    <ShieldCheck size={16} />
                    Secure report handling
                  </div>
                  <p className="text-sm text-gray-500 leading-7">
                    Supported formats: JPG, PNG, HEIC, and PDF. Make sure text is readable and all pages are visible before uploading.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all whitespace-nowrap"
                  style={{ background: P }}
                >
                  Start Upload
                </motion.button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="py-18 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp>
            <div
              className="rounded-[2.25rem] overflow-hidden border border-[#d6e5df]"
              style={{ background: `linear-gradient(135deg, #103831 0%, ${P} 48%, ${PL} 100%)` }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_1fr] gap-0">
                <div
                  className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-white/10 cursor-pointer transition-colors hover:bg-white/5"
                  onClick={() => navigate('/about-us')}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <img src="/logo.jpg" alt="LabIntel Logo" className="w-11 h-11 rounded-2xl object-contain bg-white/10 p-1.5" />
                    <span className="text-2xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
                      LabIntel
                    </span>
                  </div>
                  <h3 className="text-white text-sm font-bold uppercase tracking-[0.22em] mb-0" style={{ fontFamily: 'var(--font-body)' }}>
                    About Us
                  </h3>
                </div>

                <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-white/10">
                  <h3 className="text-white text-sm font-bold uppercase tracking-[0.22em] mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                    Contact
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-white/70 text-[11px] uppercase tracking-[0.22em] mb-2">Email</p>
                      <a href="mailto:contact.labintel@gmail.com" className="text-white text-sm font-medium break-all">
                        contact.labintel@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                <div
                  className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-white/10 cursor-pointer transition-colors hover:bg-white/5"
                  onClick={() => navigate('/terms')}
                >
                  <h3 className="text-white text-sm font-bold uppercase tracking-[0.22em] mb-0 leading-6" style={{ fontFamily: 'var(--font-body)' }}>
                    Terms And Conditions
                  </h3>
                </div>

                <div
                  className="p-8 md:p-10 cursor-pointer transition-colors hover:bg-white/5"
                  onClick={() => navigate('/refund-policy')}
                >
                  <h3 className="text-white text-sm font-bold uppercase tracking-[0.22em] mb-0 leading-6" style={{ fontFamily: 'var(--font-body)' }}>
                    Cancellation And Refund Policy
                  </h3>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <section id="reports" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp>
            <div className="rounded-3xl px-8 md:px-12 py-10 flex flex-col md:flex-row
                            items-center justify-between gap-8"
                 style={{ background: `linear-gradient(135deg, #0f3330, ${P}, ${PL})` }}>
              {/* Left */}
              <div className="text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                    <Download size={20} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold">Download Reports</h2>
                </div>
                <p className="text-white/60 text-sm max-w-sm leading-relaxed">
                  Enter your Report ID or Patient ID to instantly access and
                  download your diagnostic results. Secure and encrypted.
                </p>
              </div>

              {/* Right — Search */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Report ID or Patient ID"
                    className="w-full bg-white text-sm text-gray-700 rounded-xl pl-11 pr-4 py-3
                               outline-none border-2 border-transparent focus:border-white/30"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-white font-semibold text-sm
                             px-5 py-3 rounded-xl transition-all"
                  style={{ color: P }}
                >
                  <Download size={15} />
                  Download
                </motion.button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer id="contact" className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="LabIntel Logo" className="w-7 h-7 rounded-lg object-contain" />
            <span className="text-sm font-bold" style={{ color: P }}>LabIntel</span>
            <span className="text-gray-400 text-xs ml-1">· Precision Diagnostics Platform</span>
          </div>
          <p className="text-xs text-gray-400">
            © 2026 LabIntel. All rights reserved. · ISO 15189 Accredited · NABL Certified
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
