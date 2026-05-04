import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation, useInView } from 'framer-motion';
import {
  Beaker, ArrowRight, Phone, Clock, ShieldCheck,
  Users, Microscope, Heart, FlaskConical, Pill,
  Dna, Search, Download, Calendar, ChevronRight,
  Award, TestTube,
} from 'lucide-react';

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

/* ── Navbar (shared with RoleSelectPage) ─────────────────────────────────── */
export const Navbar = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("");

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
    { id: 'book', label: 'Book a Test' },
    { id: 'reports', label: 'Reports' },
    { id: 'contact', label: 'Contact' }
  ];

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
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <Phone size={14} />
            <span>1-800-123-4567</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLoginClick || (() => navigate('/select-role'))}
            className="text-white text-sm font-semibold px-5 py-2 rounded-full transition-all"
            style={{ background: P }}
          >
            Login
          </motion.button>
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

/* ══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════════ */
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

      {/* ── BOOK A TEST ───────────────────────────────────────────────── */}
      <section id="book" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp className="max-w-lg mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-3 text-center">
              Book a Test
            </h2>
            <p className="text-gray-500 text-sm text-center mb-8">
              Choose your test and preferred date. We'll handle the rest.
            </p>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
                 style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Select Test
                </label>
                <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl
                                   px-4 py-3 outline-none focus:border-[#14453d] transition-all
                                   text-gray-700 appearance-none">
                  <option value="">Choose a test…</option>
                  <option>Complete Blood Count (CBC)</option>
                  <option>Lipid Panel</option>
                  <option>Liver Function Test (LFT)</option>
                  <option>Thyroid Function Test (TFT)</option>
                  <option>HbA1c Blood Sugar</option>
                  <option>Vitamin D3 & B12</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Preferred Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="date"
                         className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl
                                    pl-11 pr-4 py-3 outline-none focus:border-[#14453d] transition-all
                                    text-gray-700" />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full text-white font-semibold text-sm py-3.5 rounded-xl transition-all"
                style={{ background: P }}
              >
                Confirm Booking
              </motion.button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── DOWNLOAD REPORTS ───────────────────────────────────────────── */}
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
