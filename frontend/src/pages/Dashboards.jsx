import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Beaker, LogOut, Bell, User, FileText,
  Upload, Download, X,
  ShieldCheck, Users, TrendingUp, CheckCircle,
  Search, Activity, Clock, AlertCircle, Plus, AlertTriangle,
  Stethoscope, Sparkles, Camera, ChevronRight, FolderOpen, ArrowLeft,
  Mail, Settings, Phone, Calendar, Droplet, Droplets, RefreshCw, Check,
  Printer, Heart, FlaskConical, Brain, Loader2, Zap, Cpu, Shield, Database,
  Minus, Volume2
} from 'lucide-react';

const PRINT_STYLES = `
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      height: auto !important;
      overflow: visible !important;
      font-size: 11pt !important;
    }

    #root, .no-print, .modal-overlay-bg {
      display: none !important;
    }

    .print-view-root {
      display: block !important;
      width: 100% !important;
      max-width: none !important;
      height: auto !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
    }

    .print-view-root * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .print-section {
      display: block !important;
      margin-bottom: 1.5rem !important;
    }

    .print-section-avoid {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* Allow tables to break but keep rows together */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      break-inside: auto !important;
    }

    tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    thead {
      display: table-header-group !important;
    }

    .flex-print-row {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      gap: 1rem !important;
    }

    .flex-print-row > * {
      flex: 1 !important;
    }

    .print-bg-gray { background-color: #f7f9fa !important; }
    .print-bg-blue { background-color: #3b82f6 !important; }
    .print-text-blue { color: #1e40af !important; }

    .page-break {
      page-break-after: always;
      break-after: page;
    }
  }

  @media screen {
    .is-print-mode-active {
      background: #525659 !important;
      padding: 10px !important;
      display: flex !important;
      justify-content: center !important;
    }
    @media (min-width: 768px) {
      .is-print-mode-active {
        padding: 40px !important;
      }
    }
    .is-print-mode-active .print-view-root {
      position: relative !important;
      display: block !important;
      width: 100% !important;
      max-width: 1200px !important;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3) !important;
      background: white !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    @media (min-width: 768px) {
      .is-print-mode-active .print-view-root {
        box-shadow: 0 50px 100px rgba(0,0,0,0.3) !important;
        border-radius: 20px !important;
      }
    }
  }
`;


import {
  supabase, getReports as getSupabaseReports,
  getProfile, uploadAvatar,
  TEST_OPTIONS, CATEGORY_OPTIONS
} from '../lib/supabase';
import { getServerHealth, getServerProfile, upsertServerProfile } from '../lib/serverApi';
import apiClient from '../services/apiClient';
import { useAuthStore, usePatientAuthStore } from '../store/authStore';
import AIEngine from '../components/AIEngine';
import TrendsView from '../components/TrendsView';
import ProfileUpdateModal from '../components/ProfileUpdateModal';
import {
  getUser, clearUser, getReports, saveReports, USERS,
} from '../data/mockData';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const PRIMARY = '#14453d';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
═══════════════════════════════════════════════════════════════════════════ */

/** Status badge */
const Badge = ({ status }) => {
  const map = {
    Ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-100   text-amber-700   border-amber-200',
    Processing: 'bg-teal-100    text-teal-700    border-teal-200',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5
                      rounded-full border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status === 'Ready' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
      {status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500   mr-1.5" />}
      {status === 'Processing' && <span className="w-1.5 h-1.5 rounded-full bg-teal-500    mr-1.5" />}
      {status}
    </span>
  );
};

/** Category chip */
const CategoryChip = ({ label }) => (
  <span className="text-[10px] font-semibold text-[#14453d] bg-[#e8f5f0] px-2 py-0.5 rounded-full">
    {label}
  </span>
);

/** Teal primary button */
const TealBtn = ({ children, onClick, disabled, size = 'md', className = '' }) => (
  <button onClick={onClick} disabled={disabled}
    className={`flex items-center gap-2 text-white font-semibold rounded-xl
                      transition-all disabled:opacity-40 disabled:cursor-not-allowed
                      hover:opacity-90 active:scale-95 ${size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2.5'}
                      ${className}`}
    style={{ background: PRIMARY }}>
    {children}
  </button>
);

/** Search input bar */
const SearchBar = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200
                  rounded-xl px-3 py-2 flex-1 max-w-xs">
    <Search size={14} className="text-gray-400 shrink-0" />
    <input value={value} onChange={e => onChange(e.target.value)}
      className="bg-transparent text-sm text-gray-600 outline-none
                      placeholder-gray-400 w-full"
      placeholder={placeholder} />
  </div>
);

const getPublicUrl = (path) => {
  if (!path) return null;
  const value = String(path).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const pdfBucket = import.meta.env.VITE_PDF_STORAGE_BUCKET || 'pdfs';

  // Supabase signed URLs may be returned as relative paths (e.g. /storage/v1/object/sign/...)
  if (value.startsWith('/')) {
    if (supabaseUrl && value.startsWith('/storage/')) return `${supabaseUrl}${value}`;
    return value;
  }

  if (supabaseUrl && value.startsWith('storage/')) {
    return `${supabaseUrl}/${value}`;
  }

  if (!supabaseUrl) return value;
  return `${supabaseUrl}/storage/v1/object/public/${pdfBucket}/${value}`;
};

const resolveReportPdfUrl = (reportLike) => {
  if (!reportLike) return null;
  const raw =
    reportLike.exact_pdf_url ||
    reportLike.source_pdf_url ||
    reportLike.pdf_url;
  return getPublicUrl(raw);
};

const AILoaderView = ({ report, onSkip }) => {
  const [step, setStep] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const reportUrl = getPublicUrl(report?.pdf_url);

  const steps = [
    "Initializing AI Engine",
    "Scanning Biomarkers",
    "Correlating Ranges",
    "Detecting Patterns",
    "Synthesizing Labs",
    "Identifying Specialist",
    "Drafting Protocol",
    "Finalizing Report"
  ];

  const extractionHUD = [
    "Header: Institutional Lab Found",
    "Extracted: Clinical Biomarkers",
    "Extracted: Reference Alignment",
    "Extracted: Physiological Ranges",
    "Extracted: Pathological Trends",
    "Extracted: Metabolic Indicators",
    "Pathologist Signature Detected",
    "Digital Twin Finalized"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 600); // 5000ms / 8 steps = ~625ms
    return () => clearInterval(timer);
  }, []);

  const isPDF = reportUrl?.toLowerCase().endsWith('.pdf');
  const hasDoc = reportUrl && !imgError;

  return (
    <div className="flex items-center justify-center h-full w-full bg-slate-900/5 backdrop-blur-sm relative font-outfit overflow-hidden p-6">

      {/* 📦 THE POP-UP BOX (HIGH FIDELITY) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[580px] bg-white rounded-3xl md:rounded-[3rem] shadow-[0_40px_120px_rgba(20,69,61,0.18)] border border-emerald-50 overflow-hidden flex flex-col"
      >
        {/* Top: Holographic Diagnostic Scan */}
        <div className="bg-[#14453d] p-6 md:p-12 flex flex-col items-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

           {/* Rotating Diagnostic Rings */}
           <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center mb-6 md:mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-emerald-400/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-[1px] border-dashed border-emerald-400/20 rounded-full"
              />

              {/* Central Pulse Orb */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 md:w-28 md:h-28 bg-emerald-400/10 rounded-full flex items-center justify-center relative"
              >
                 <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full" />
                 <Brain size={32} className="text-emerald-400 md:w-[42px] md:h-[42px] relative z-10" />
              </motion.div>

              {/* Scanning Beam */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 z-20 pointer-events-none"
              >
                 <div className="h-full w-1 bg-gradient-to-t from-emerald-400 to-transparent absolute left-1/2 -translate-x-1/2 blur-sm" />
              </motion.div>
           </div>

           <div className="text-center relative z-10">
              <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-emerald-400/60 mb-2">Neural Diagnostic Engine</h2>
              <h1 className="text-lg md:text-2xl font-black text-white uppercase tracking-tightest">Synthesizing Report...</h1>
           </div>
        </div>

        {/* Bottom: Progress & Steps */}
        <div className="p-6 md:p-10 space-y-6 md:space-y-8">
           <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[12px] font-black text-[#14453d] uppercase tracking-widest">{steps[step]}</p>
                 </div>
                 <span className="text-[11px] font-black text-emerald-600 uppercase">{step + 1} / 8</span>
              </div>

              <div className="h-2 w-full bg-emerald-50 rounded-full overflow-hidden border border-emerald-100/50">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                   className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                 />
              </div>
           </div>

           <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Live Data Extraction</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[14px] font-black text-[#14453d] uppercase tracking-tight"
                >
                  {extractionHUD[step]}
                </motion.div>
              </AnimatePresence>
           </div>

           <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className="w-full py-4 rounded-2xl bg-gray-50 border border-gray-100 text-[#14453d] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#14453d] hover:text-white hover:border-[#14453d] transition-all duration-300 shadow-sm"
            >
              Skip Synthesis & View Report
            </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const AIReportPrintView = ({ data, compact = false }) => {
  if (!data) return null;

  const patient = data.patients || {};
  const lab = data.labs || {};
  const insight = data.ai_analysis || data.insights || {};
  const results = data.results || [];

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const patientName = (data.patients?.full_name || data.patientInfo?.name || data.patient_name || 'Valued Patient');
  const patientAge = data.patients?.date_of_birth ?
    Math.abs(new Date(Date.now() - new Date(data.patients.date_of_birth).getTime()).getUTCFullYear() - 1970) :
    (data.patientInfo?.age || '21');
  const patientGender = (data.patients?.gender || data.patientInfo?.gender || 'Male');
  const reportDate = formatDate(data.reported_at || data.date || new Date());
  const accessionNo = String(data.id || 'A59BE841').slice(0, 8).toUpperCase();

  const RangeVisualizer = ({ val, min, max, range, unit }) => {
    // Smart Parsing: If min/max are missing but range string exists, try to extract them
    let mn = parseFloat(min);
    let mx = parseFloat(max);

    if ((isNaN(mn) || isNaN(mx)) && range) {
      const parts = range.split(/[-–—]/); // Handle various dash types
      if (parts.length === 2) {
        mn = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
        mx = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
      } else if (range.toLowerCase().includes('less than')) {
        mn = 0;
        mx = parseFloat(range.replace(/[^0-9.]/g, ''));
      }
    }

    const v = parseFloat(val);

    if (isNaN(v) || isNaN(mn) || isNaN(mx)) return <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest italic leading-tight">No Numerical Range Available</span>;

    const rangeStart = mn * 0.7;
    const rangeEnd = mx * 1.3;
    const totalRange = rangeEnd - rangeStart;
    const pos = Math.min(100, Math.max(0, ((v - rangeStart) / totalRange) * 100));

    const normalStart = ((mn - rangeStart) / totalRange) * 100;
    const normalEnd = ((mx - rangeStart) / totalRange) * 100;

    return (
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex justify-between text-[7px] font-black text-gray-300 uppercase tracking-[0.2em]">
          <span>Optimal Range</span>
          <span className="text-blue-400">Ref: {mn}-{mx}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full relative overflow-hidden shadow-inner border border-gray-50">
          {/* Normal Zone (Green Gradient) */}
          <div
            className="absolute h-full bg-gradient-to-r from-emerald-400/20 via-emerald-400/40 to-emerald-400/20 border-x border-white/40"
            style={{ left: `${normalStart}%`, width: `${normalEnd - normalStart}%` }}
          />
          {/* High Zone (Red Gradient) */}
          <div
            className="absolute h-full bg-gradient-to-r from-rose-400/20 to-rose-400/40"
            style={{ left: `${normalEnd}%`, right: 0 }}
          />

          {/* Active Result Pointer */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] z-20 transition-all duration-700 ease-out"
            style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <div className="flex justify-between items-center px-0.5">
           <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Low</span>
           <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Elevated</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white font-sans text-gray-800" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>

      {/* 1. PREMIUM BRANDED HEADER */}
      <div className="relative overflow-hidden pt-2 md:pt-4 px-4 md:px-10 pb-2 md:pb-3">
        {/* Modern Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-transparent opacity-80" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-0">
          <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <img src="/logo.jpg" alt="LabIntel" className="w-12 h-12 rounded-xl object-contain shadow-sm border border-gray-100" />
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-black text-blue-900 tracking-tighter uppercase leading-none">labintel</h1>
                <p className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.25em] mt-1">
                  Reimagining Healthcare for Every Indian
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:gap-2.5 text-center md:text-right w-full md:w-auto">
            <div className="flex items-center justify-center md:justify-end gap-3 text-gray-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
              <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <Phone size={9} />
              </div>
              <span>+91 97329 45407</span>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-3 text-gray-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
              <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <Mail size={9} />
              </div>
              <span className="truncate">contact.labintel@gmail.com</span>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-3 text-gray-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
              <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <Activity size={9} />
              </div>
              <span>www.labintel.in</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PATIENT INFO BAR */}
      <div className="px-4 md:px-10 mb-2">
        <div className="border-y border-gray-100 py-2 grid grid-cols-2 md:grid-cols-4 gap-6 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          <div className="flex flex-col gap-1">
            <span className="opacity-60">Patient Name</span>
            <span className="text-gray-900 text-[12px] md:text-[14px] tracking-tight">{patientName}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-gray-100 pl-6">
            <span className="opacity-60">Accession No</span>
            <span className="text-gray-900 text-[12px] md:text-[14px] tracking-tight font-mono">{accessionNo}</span>
          </div>
          <div className="flex flex-col gap-1 md:border-l border-gray-100 md:pl-6">
            <span className="opacity-60">Age / Gender</span>
            <span className="text-gray-900 text-[12px] md:text-[14px] tracking-tight">{patientAge} Yrs / {patientGender}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-gray-100 pl-6">
            <span className="opacity-60">Test Date</span>
            <span className="text-gray-900 text-[12px] md:text-[14px] tracking-tight">{reportDate}</span>
          </div>
        </div>
      </div>

      {/* 3. CLINICAL SUMMARY */}
      <div className="px-4 md:px-10 mb-2 print-section-avoid">
        <div className="bg-[#f8faff] rounded-[1rem] md:rounded-[1.5rem] p-3 md:p-4 relative overflow-hidden border border-blue-100/50 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -translate-y-12 translate-x-12" />
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
               <Brain size={28} />
            </div>
            <div className="flex-1">
               <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Clinical Synthesis</h2>
               <div className="text-[13px] md:text-[14px] leading-relaxed text-gray-600 space-y-4 antialiased font-medium">
                  {insight.summary ? (
                    insight.summary.split('\n').map((para, i) => <p key={i}>{para}</p>)
                  ) : (
                    <p>Our neural diagnostic engine has successfully extracted and synthesized the biomarkers from your laboratory documentation. The following analysis provides a comprehensive overview of your physiological state based on detected reference deviations.</p>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BIOMARKER ANALYSIS (SIDE-BY-SIDE GRID) */}
      <div className="px-4 md:px-10 mb-3 print-section">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2 print-section-avoid">
          <h3 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em]">Parameter Insights</h3>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Normal</span>
            <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest border border-rose-100">Critical</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-100">Monitor</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {results.map((r, i) => {
            const status = (r.flag || '').toLowerCase();
            const isAbnormal = status.includes('abnormal') || status.includes('high') || status.includes('low');
            const isBorderline = status.includes('borderline') || status.includes('moderate');

            return (
              <div key={i} className="print-section-avoid bg-white rounded-xl border border-gray-100 p-3 md:p-3.5 flex flex-col gap-2 hover:bg-blue-50/20 transition-all shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-[13px] md:text-[14px] font-black tracking-tight ${isAbnormal ? 'text-rose-600' : 'text-gray-900'} leading-tight`}>{r.name}</p>
                    <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{r.category || 'Clinical Panel'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1.5">
                      <p className={`text-xl md:text-2xl font-black ${isAbnormal ? 'text-rose-600' : isBorderline ? 'text-amber-600' : 'text-emerald-600'} tracking-tighter leading-none`}>
                        {r.value}
                      </p>
                      <span className="text-[8px] md:text-[9px] font-black text-gray-300 uppercase tracking-widest">{r.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <RangeVisualizer val={r.value} min={r.ref_min} max={r.ref_max} range={r.range} unit={r.unit} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DYNAMIC HEALTH GUIDANCE */}
      <div className="px-4 md:px-10 mb-6 print-section-avoid">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-gray-100" />
          <h3 className="text-[10px] md:text-[11px] font-black text-blue-900 uppercase tracking-[0.5em] shrink-0 px-4">Health Guidance</h3>
          <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-gray-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
           {(insight.recommendations || [
             { title: 'Metabolic Hydration', text: 'Optimizing cellular hydration (3L+ daily) is critical for efficient biomarker transport and waste clearance.', icon: 'Droplet' },
             { title: 'Nutritional Strategy', text: 'Focus on low-glycemic, anti-inflammatory whole foods to stabilize metabolic indicators and reduce systemic stress.', icon: 'Zap' },
             { title: 'Cardiac Resilience', text: 'Consistent zones of aerobic activity (150 min/week) improve lipid profiles and cardiac biomarker efficiency.', icon: 'Heart' },
             { title: 'Systemic Recovery', text: 'Sleep hygiene (7.5h+) is the primary driver for hormone regulation and immune system biomarker homeostasis.', icon: 'Shield' }
           ]).slice(0, 4).map((rec, idx) => {
             const type = rec.icon || (idx === 0 ? 'Droplet' : idx === 1 ? 'Zap' : idx === 2 ? 'Heart' : 'Shield');
             const themes = {
               Droplet: { bg: 'from-blue-500/5 to-blue-600/[0.02]', text: 'text-blue-600', border: 'border-blue-100/50', iconBg: 'bg-blue-50', icon: Droplet },
               Zap: { bg: 'from-amber-500/5 to-amber-600/[0.02]', text: 'text-amber-600', border: 'border-amber-100/50', iconBg: 'bg-amber-50', icon: Zap },
               Heart: { bg: 'from-rose-500/5 to-rose-600/[0.02]', text: 'text-rose-600', border: 'border-rose-100/50', iconBg: 'bg-rose-50', icon: Heart },
               Shield: { bg: 'from-emerald-500/5 to-emerald-600/[0.02]', text: 'text-emerald-600', border: 'border-emerald-100/50', iconBg: 'bg-emerald-50', icon: Shield }
             };
             const theme = themes[type] || themes.Droplet;
             const IconComponent = theme.icon;

             return (
               <div key={idx} className={`flex gap-4 p-4 rounded-[1.5rem] bg-gradient-to-br ${theme.bg} border ${theme.border} shadow-sm group hover:shadow-md transition-all duration-500 hover:-translate-y-1`}>
                  <div className={`w-11 h-11 rounded-xl ${theme.iconBg} flex items-center justify-center ${theme.text} shrink-0 border border-white shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                     <IconComponent size={20} />
                  </div>
                  <div className="flex flex-col gap-2">
                     <span className={`text-[13px] md:text-[14px] font-black uppercase tracking-tight ${theme.text}`}>{rec.title || 'Guidance Plan'}</span>
                     <p className="text-[12px] md:text-[13px] text-gray-600 font-medium leading-relaxed antialiased">
                        {rec.text || rec.description || rec}
                     </p>
                   </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* 6. MEDICAL DISCLAIMER */}
      <div className="px-4 md:px-10 mb-10 print-section-avoid">
        <div className="bg-rose-50 rounded-2xl md:rounded-full py-4 px-6 md:px-10 border border-rose-100 shadow-sm text-center mx-auto max-w-full md:max-w-[80%]">
          <p className="text-rose-600 font-black text-[9px] md:text-[10px] uppercase tracking-[0.12em] italic">
            AI Analysis: This synthesis must be confirmed by a certified hematologist.
          </p>
        </div>
      </div>

      {/* 6. FOOTER */}
      <div className="mt-auto px-4 md:px-10 pb-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          <span>Powered By</span>
          <div className="flex items-center gap-1 text-blue-400">
            <Activity size={10} />
            <span className="font-black">labintel</span>
          </div>
        </div>
        <div className="w-full h-0.5 md:h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-2 bg-blue-600 no-print" />
    </div>
  );
};

const ReportModal = ({ report, onClose }) => {
  const [fullReport, setFullReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('ai'); // 'ai', 'original', or 'dual'
  const fullReportPdfUrl = resolveReportPdfUrl(fullReport || report);

  useEffect(() => {
    if (!report) {
      setFullReport(null);
      return;
    }

    // Reset fullReport and set loading to true to trigger the AILoaderView for a fresh "AI Analysis" feel
    setFullReport(null);
    setLoading(true);

    const fetchFullReport = async () => {
      try {
        // Start fetching data and simulate AI synthesis delay
        const [response] = await Promise.all([
          apiClient.get(`/patient/reports/${report.id}`),
          new Promise(resolve => setTimeout(resolve, 5000)) // Set to 5 seconds as requested
        ]);

        const data = response.data?.data;
        if (data) {
          const results = (data.test_values || []).map(tv => ({
            name: tv.test_parameters?.name || 'Unknown Parameter',
            value: tv.value,
            unit: tv.test_parameters?.unit || '',
            range: `${tv.test_parameters?.ref_min_male || '—'} - ${tv.test_parameters?.ref_max_male || '—'}`,
            flag: tv.flag || 'normal',
            insight: tv.insight || tv.interpretation || '',
            solution: tv.solution || tv.corrective_action || tv.creativeSolution || '',
            suggested_medicine: tv.suggested_medicine || tv.suggestedMedicine || '',
            suggested_specialist: tv.suggested_specialist || tv.suggestedSpecialist || '',
          }));

          setFullReport({
            ...report,
            results: results,
            testName: data.test_panels?.name || report.testName,
            patients: data.patients,
            labs: data.labs,
            insights: data.report_insights?.[0] || data.report_insights,
            ai_analysis: data.ai_analysis || null,
            reported_at: data.reported_at,
            pdf_url: data.pdf_url || report.pdf_url,
            referring_doctor: data.referring_doctor
          });
        }
      } catch (err) {
        console.error('Failed to fetch full report:', err);
        setFullReport(report);
      } finally {
        setLoading(false);
      }
    };

    fetchFullReport();
  }, [report]);

  if (!report) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 no-print"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}>

        <div className="absolute inset-0 modal-overlay-bg no-print" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-[98vw] h-[95vh] md:w-[95vw] md:h-[92vh] max-w-[1600px] rounded-3xl md:rounded-[3.5rem] overflow-hidden flex flex-col no-print shadow-[0_50px_150px_rgba(0,0,0,0.35)] border border-white/20 relative"
        >
          {/* Institutional PDF Viewer Header */}
          <div className="flex items-center justify-between p-4 px-6 md:px-10 bg-[#323639] text-white z-[60] sticky top-0 shadow-2xl">
            <div className="flex items-center gap-4 md:gap-8 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <FileText size={18} className="text-emerald-400" />
                </div>
                <div className="truncate max-w-[200px] md:max-w-[400px]">
                  <h2 className="text-[11px] md:text-sm font-bold tracking-tight text-gray-100 truncate">
                    {fullReport?.id ? `${fullReport.id.toUpperCase()}.pdf` : 'AI_CLINICAL_REPORT.pdf'}
                  </h2>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-white/5 rounded-md border border-white/10">
                <button className="text-gray-400 hover:text-white transition-colors"><Minus size={14} /></button>
                <span className="text-[11px] font-bold w-12 text-center text-gray-200">100%</span>
                <button className="text-gray-400 hover:text-white transition-colors"><Plus size={14} /></button>
              </div>

              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 ml-4 border border-white/10">
                <button
                  onClick={() => setViewMode('ai')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'ai' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  AI Analysis
                </button>
                <button
                  onClick={() => setViewMode('dual')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'dual' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Dual View
                </button>
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'original' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Original PDF
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-gray-400 text-[11px] font-bold ml-6">
                <span className="bg-white/10 px-2 py-0.5 rounded">1</span>
                <span>/</span>
                <span>1</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="flex items-center gap-1 md:gap-2 mr-2 md:mr-4">
                <button
                  onClick={() => {
                    if (fullReportPdfUrl) {
                      window.open(fullReportPdfUrl, '_blank', 'noopener,noreferrer');
                    } else if (window.__TRIGGER_NUCLEAR_PRINT__) {
                      window.__TRIGGER_NUCLEAR_PRINT__(fullReport);
                    } else {
                      window.print();
                    }
                  }}
                  className="p-2 md:p-3 hover:bg-white/10 rounded-lg transition-all text-gray-300 hover:text-emerald-400"
                  title="Download / Export"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => {
                    if (fullReportPdfUrl) {
                      const printWindow = window.open(fullReportPdfUrl, '_blank', 'noopener,noreferrer');
                      if (printWindow) {
                        printWindow.focus();
                      }
                    } else if (window.__TRIGGER_NUCLEAR_PRINT__) {
                      window.__TRIGGER_NUCLEAR_PRINT__(fullReport);
                    } else {
                      window.print();
                    }
                  }}
                  className="p-2 md:p-3 hover:bg-white/10 rounded-lg transition-all text-gray-300 hover:text-emerald-400"
                  title="Print Report"
                >
                  <Printer size={20} />
                </button>
              </div>
              <div className="h-8 w-px bg-white/10 mx-1 md:mx-2" />
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 rounded-xl text-gray-400 transition-all active:scale-90"
                title="Close Viewer"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-100/30 p-2 md:p-12 print-content-wrap">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center no-print">
                 <AILoaderView report={report} onSkip={() => setLoading(false)} />
              </div>
            ) : viewMode === 'dual' ? (
              <div className="h-full w-full flex flex-col lg:flex-row gap-6 p-4">
                <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 h-full">
                  <iframe
                    src={fullReportPdfUrl || ''}
                    className="w-full h-full border-none"
                    title="Original Lab Report"
                  />
                </div>
                <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-y-auto custom-report-scroll h-full">
                  <AIReportPrintView data={fullReport} compact />
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="flex justify-center w-full"
              >
                 <div className="w-full max-w-[1000px] shadow-2xl transition-all duration-500 print-report-canvas">
                  <AIReportPrintView data={fullReport} />
                </div>
              </motion.div>
            )
            }
          </div>
        </motion.div>

        {/* Print Only Styles */}
        {/* Print Styles are handled globally at the top of the file */}

        {/* No portal needed - printing the canvas directly from the modal */}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};




/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR + HEADER + SHELL
═══════════════════════════════════════════════════════════════════════════ */
const Logo = () => (
  <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-gray-100 shrink-0">
    <img src="/logo.jpg" alt="LabIntel Logo" className="w-7 h-7 rounded-lg object-contain bg-white" />
    <span className="text-base font-bold text-[#14453d] tracking-tight">LabIntel</span>
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left
                      text-sm font-semibold transition-all duration-150
                      ${active
        ? 'bg-[#e8f5f0] text-[#14453d]'
        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
    <Icon size={16} strokeWidth={active ? 2.2 : 1.8}
      className={active ? 'text-[#14453d]' : 'text-gray-400'} />
    {label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */
const Toast = ({ message, type = 'success', onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
        type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' :
          'bg-gray-50 border-gray-100 text-gray-800'
      }`}
    style={{ minWidth: '280px', pointerEvents: 'auto' }}
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${type === 'success' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
      }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <Sparkles size={18} />}
    </div>
    <span className="text-sm font-bold tracking-tight">{message}</span>
    <button onClick={onClose} className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-all text-gray-400 focus:outline-none">
      <X size={14} />
    </button>
  </motion.div>
);

const Sidebar = ({ navItems, activeIdx, setActiveIdx, user, onLogout }) => (
  <div className="hidden md:flex w-52 shrink-0 bg-white border-r border-gray-100 flex-col no-print">
    <Logo />
    <nav className="flex-1 p-3 pt-4 space-y-0.5">
      {navItems.map((item, i) => (
        <NavItem key={item.label} icon={item.icon} label={item.label}
          active={activeIdx === i} onClick={() => setActiveIdx(i)} />
      ))}
    </nav>
    {/* Sidebar bottom section removed - user info and logout are now in the top-right profile dropdown */}
  </div>
);

/** Mobile Bottom Navigation - Premium App-like feel */
const MobileBottomNav = ({ navItems, activeIdx, setActiveIdx }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex items-center justify-around px-4 z-[150] no-print">
    {navItems.map((item, i) => {
      const Icon = item.icon;
      const active = activeIdx === i;
      return (
        <button
          key={item.label}
          onClick={() => setActiveIdx(i)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-[#14453d]' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${active ? 'bg-[#e8f5f0]' : ''}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-0'}`}>
            {item.label.split(' ')[0]}
          </span>
        </button>
      );
    })}
  </div>
);


/* ═══════════════════════════════════════════════════════════════════════════
   PROFILE & UPDATE COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const ProfileDropdown = ({ user, onClose, onUpdateClick, onMyReportsClick, onLogout }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
    >
      {/* Header Profile Section */}
      <div className="p-6 bg-[#f8faf9] flex flex-col items-center border-b border-gray-100">
        <div className="relative group">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-sm" style={{ background: PRIMARY }}>
              {user.avatar}
            </div>
          )}
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-800">{user.name}</h3>
        <p className="text-xs text-gray-400 font-medium">{user.email}</p>
      </div>

      {/* Menu Options */}
      <div className="p-2">
        <button onClick={onUpdateClick} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-white transition-all">
            <Settings size={16} />
          </div>
          <span className="text-sm font-semibold">Update Profile</span>
          <ChevronRight size={14} className="ml-auto text-gray-300" />
        </button>

        <button onClick={onMyReportsClick} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-[#e8f5f0] text-[#14453d] flex items-center justify-center group-hover:bg-white transition-all">
            <FolderOpen size={16} />
          </div>
          <span className="text-sm font-semibold">My Reports</span>
          <ChevronRight size={14} className="ml-auto text-gray-300" />
        </button>

        <div className="h-px bg-gray-50 my-2 mx-2" />

        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-500 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-white transition-all">
            <LogOut size={16} />
          </div>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
};



const TopBar = ({ showSearch, search, setSearch, user, onProfileClick, onBackHome }) => (
  <div className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 shrink-0 no-print">
    <button
      onClick={onBackHome}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-600 transition-all hover:border-[#14453d]/20 hover:bg-[#f2f7f5] hover:text-[#14453d]"
    >
      <ArrowLeft size={14} />
      Back
    </button>
    {showSearch
      ? <SearchBar value={search} onChange={setSearch} placeholder="Search reports, patients…" />
      : <div className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">Dashboard</div>
    }
    <div className="ml-auto flex items-center gap-4">
      <button className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-all">
        <Bell size={17} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
      </button>

      <div className="h-6 w-px bg-gray-200 mx-1" />

      <button
        onClick={onProfileClick}
        className="flex items-center gap-2 group p-0.5 rounded-full hover:bg-gray-50 transition-all relative"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#14453d]/20 transition-all shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: PRIMARY }}>
              {user.avatar}
            </div>
          )}
        </div>
        <div className="hidden md:flex flex-col items-start pr-2">
          <span className="text-xs font-bold text-gray-700 leading-none">{user.name}</span>
          <span className="text-[9px] text-gray-400 font-medium mt-0.5 capitalize">{user.role}</span>
        </div>
      </button>
    </div>
  </div>
);

/** Master layout shell used by all 3 portals */
const Shell = ({ navItems, showSearch = false, renderContent, isPatient = false }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [user, setUserState] = useState(null);
  const [search, setSearch] = useState('');
  const [showAiEngine, setShowAiEngine] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const navigate = useNavigate();

  const staffUser = useAuthStore((s) => s.user);
  const staffClear = useAuthStore((s) => s.clearAuth);
  const patientUser = usePatientAuthStore((s) => s.user);
  const patientClear = usePatientAuthStore((s) => s.clearAuth);

  const authStoreUser = isPatient ? patientUser : staffUser;
  const clearAuth = isPatient ? patientClear : staffClear;

  const fetchFullProfile = async () => {
    try {
      if (!authStoreUser) {
        navigate('/select-role');
        return;
      }

      // If patient, fetch fresh data from the server to sync any changes
      if (authStoreUser.role === 'patient') {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || useAuthStore.getState().token;
        if (token) {
          try {
            const profileRes = await getServerProfile(token);
            if (profileRes && profileRes.data) {
              const freshData = profileRes.data;
              // Check if anything actually changed to prevent infinite loops
              const hasChanged =
                authStoreUser.full_name !== freshData.full_name ||
                authStoreUser.phone !== freshData.phone ||
                authStoreUser.date_of_birth !== freshData.date_of_birth;

              if (hasChanged) {
                useAuthStore.getState().setAuth(
                  token,
                  { ...authStoreUser, ...freshData },
                  useAuthStore.getState().lab
                );
              }
            }
          } catch (e) {
            console.error('Could not sync profile from server:', e);
          }
        }
      }

      // Always use the freshest state from the store
      const latestUser = useAuthStore.getState().user || authStoreUser;

      setUserState({
        id: latestUser.id,
        patientDbId: latestUser.id,
        name: latestUser.full_name || latestUser.email?.split('@')[0] || latestUser.phone,
        email: latestUser.email || '',
        phone: latestUser.phone || '',
        dob: latestUser.date_of_birth || '',
        gender: latestUser.gender || '',
        avatar_url: latestUser.avatar_url || null,
        role: latestUser.role || 'patient',
        avatar: (latestUser.full_name || latestUser.email || 'U').charAt(0).toUpperCase()
      });
    } catch (err) {
      console.error('Failed to set profile:', err);
    }
  };

  useEffect(() => {
    fetchFullProfile();
    // Check for Print Mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === 'true') {
      const stored = localStorage.getItem('last_ai_analysis');
      if (stored) {
        setPrintData(JSON.parse(stored));
        setIsPrinting(true);
        setTimeout(() => {
          window.print();
        }, 1500);
      }
    }
    // Check if we just logged in
    if (params.get('login') === 'success') {
      addToast('Welcome back to your portal!', 'success');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('profile') === 'update') {
      setIsUpdateModalOpen(true);
      params.delete('profile');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
      window.history.replaceState({}, document.title, nextUrl);
    }
  }, [navigate, authStoreUser]);

  // Centralized Nuclear Print Trigger
  useEffect(() => {
    window.__TRIGGER_NUCLEAR_PRINT__ = (pd) => {
      setPrintData(pd);
      setIsPrinting(true);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 800);
    };
  }, []);

  if (!user) return null;

  const onLogout = async () => {
    addToast('Logging out safely...', 'info');
    setTimeout(async () => {
      clearAuth();
      await supabase.auth.signOut();
      navigate('/');
    }, 800);
  };

  const analysisPdfUrl = resolveReportPdfUrl(aiAnalysis);
  const useOriginalPdfAnalysis = Boolean(aiAnalysis?.force_original_pdf_analysis && analysisPdfUrl);

  return (
    <div className="dashboard-shell-outer min-h-screen" style={{ background: '#f5f7f6' }}>
      <style>{`
        @media print {
          .dashboard-shell-outer {
            min-height: 0 !important;
            display: block !important;
            padding: 0 !important;
            background: white !important;
          }
          .dashboard-shell {
            display: none !important;
          }
        }
        .custom-report-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-report-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-report-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-report-scroll::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        ${PRINT_STYLES}
      `}</style>
      {isPrinting && printData && createPortal(
        <div className={`fixed inset-0 z-[20000] bg-white overflow-y-auto print:relative print:z-0 print:overflow-visible print-view-root ${new URLSearchParams(window.location.search).get('print') === 'true' ? 'is-print-mode-active' : ''}`}>
          <AIReportPrintView data={printData} compact />
        </div>,
        document.body
      )}
      {!isPrinting && (
        <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="dashboard-shell relative z-10 flex h-screen w-full overflow-hidden bg-white"
        style={{
          boxShadow: 'none',
        }}
      >
        <Sidebar navItems={navItems} activeIdx={activeIdx}
          setActiveIdx={(i) => { setActiveIdx(i); setSearch(''); setShowAiEngine(false); setAiAnalysis(null); }}
          user={user}
          onLogout={onLogout}
          className="dashboard-sidebar no-print" />

        <MobileBottomNav
          navItems={navItems}
          activeIdx={activeIdx}
          setActiveIdx={(i) => { setActiveIdx(i); setSearch(''); setShowAiEngine(false); setAiAnalysis(null); }}
        />

        <div className="dashboard-main flex-1 flex flex-col overflow-hidden relative">
          <TopBar
            showSearch={showSearch}
            search={search}
            setSearch={setSearch}
            user={user}
            onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
            onBackHome={() => navigate('/')}
            className="dashboard-topbar no-print"
          />

          <AnimatePresence>
            {isProfileOpen && (
              <ProfileDropdown
                user={user}
                onClose={() => setIsProfileOpen(false)}
                onUpdateClick={() => { setIsProfileOpen(false); setIsUpdateModalOpen(true); }}
                onMyReportsClick={() => { setIsProfileOpen(false); navigate('/patient'); }}
                onLogout={onLogout}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isUpdateModalOpen && (
              <ProfileUpdateModal
                user={user}
                onClose={() => setIsUpdateModalOpen(false)}
                onUpdated={() => {
                  fetchFullProfile();
                  addToast('Profile updated successfully!');
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toasts.map(toast => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              />
            ))}
          </AnimatePresence>
          <div className="dashboard-scroll flex-1 relative flex flex-col min-h-0" style={{ background: '#f8faf9' }}>
            {showAiEngine ? (
              <AIEngine
                patientId={user.id}
                onAnalysisComplete={async (data) => {
                  setAiAnalysis(data);
                  setShowAiEngine(false);

                  if (user.role === 'patient') {
                    try {
                      const payload = {
                        patient_id: user.id,
                        patient_name: data.patientInfo.name || user.name,
                        test_name: data.results[0]?.parameter || 'AI Analysis',
                        date: new Date().toISOString().split('T')[0],
                        status: 'Ready',
                        category: 'Biochemistry',
                        results: data.results.map(r => ({
                          name: r.parameter,
                          value: r.value,
                          unit: r.unit,
                          range: r.range,
                          flag: r.flag
                        })),
                        uploaded_by: 'AI Engine',
                      };
                      await apiClient.post('/reports', payload);
                    } catch (err) {
                      console.error('Failed to auto-save AI report:', err);
                    }
                  }
                }}
                onClose={() => setShowAiEngine(false)}
              />
            ) : aiAnalysis ? (
              <div className="absolute inset-0 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-8 shrink-0 pb-6">
                  <button
                    onClick={() => setAiAnalysis(null)}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-[#14453d] rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-gray-200/50 hover:-translate-x-1 transition-all group border border-gray-100/50"
                  >
                    <ArrowLeft size={18} className="group-hover:scale-110 transition-transform" />
                    Exit Analysis
                  </button>
                  <TealBtn onClick={() => {
                    if (useOriginalPdfAnalysis && analysisPdfUrl) {
                      const printWindow = window.open(analysisPdfUrl, '_blank', 'noopener,noreferrer');
                      if (printWindow) {
                        printWindow.focus();
                      }
                    } else if (window.__TRIGGER_NUCLEAR_PRINT__) {
                      window.__TRIGGER_NUCLEAR_PRINT__(aiAnalysis);
                    } else {
                      window.print();
                    }
                  }} size="sm" className="shadow-2xl shadow-[#14453d]/10 !px-8 !py-4 rounded-2xl">
                    <Printer size={18} />
                    {useOriginalPdfAnalysis ? 'OPEN SOURCE PDF' : 'EXPORT CLINICAL PDF'}
                  </TealBtn>
                </div>

                <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-10 flex-1 overflow-y-auto pb-20 custom-report-scroll">
                  <div className="bg-white rounded-[3rem] sm:rounded-[4.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 relative">
                     <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-20" />
                     {useOriginalPdfAnalysis ? (
                       <div className="p-8 sm:p-10">
                         <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white h-[78vh]">
                           <iframe
                             src={analysisPdfUrl}
                             className="w-full h-full border-none"
                             title="AI Analysis Source PDF"
                           />
                         </div>
                       </div>
                     ) : (
                       <AIReportPrintView data={aiAnalysis} />
                     )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 md:pb-12 custom-report-scroll">
                {renderContent(activeIdx, user, search, (data) => {
                  setAiAnalysis(data);
                  // Also provide a handle for nuclear printing
                  window.__TRIGGER_NUCLEAR_PRINT__ = (pd) => {
                    setPrintData(pd);
                    setIsPrinting(true);
                    setTimeout(() => {
                      window.print();
                      setIsPrinting(false);
                    }, 500);
                  };
                })}
              </div>
            )}
          </div>
        </div>
        </motion.div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ① PATIENT PORTAL — My Reports + Timeline
═══════════════════════════════════════════════════════════════════════════ */

/** Animated report card */
function ReportTracking({ report }) {
  const steps = [
    { label: 'Booking', date: report.created_at, completed: true },
    { label: 'Sample Collection', date: report.collected_at, completed: !!report.collected_at },
    { label: 'Test Done', date: (report.status === 'Processing' || report.status === 'Ready') ? report.date : null, completed: report.status === 'Processing' || report.status === 'Ready' },
    { label: 'Released', date: report.status === 'Ready' ? report.date : null, completed: report.status === 'Ready' },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
      <div className="flex justify-between items-center px-1">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Track Progress</h4>
        <div className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Live Update</div>
      </div>
      <div className="grid grid-cols-4 gap-2 relative">
        {/* Horizontal line */}
        <div className="absolute top-3 left-[12.5%] right-[12.5%] h-0.5 bg-gray-100 -z-0" />
        <div className="absolute top-3 left-[12.5%] h-0.5 bg-emerald-500 -z-0 transition-all duration-500"
          style={{ width: report.status === 'Ready' ? '75%' : report.status === 'Processing' ? '50%' : report.collected_at ? '25%' : '0%' }} />

        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2 relative z-10">
            <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 transition-all duration-500
              ${step.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border-gray-100 text-gray-200'}`}>
              {step.completed ? <CheckCircle size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>
            <div className="text-center">
              <p className={`text-[9px] font-black uppercase tracking-tighter ${step.completed ? 'text-gray-700' : 'text-gray-300'}`}>{step.label}</p>
              {step.date && <p className="text-[8px] font-bold text-gray-400 mt-0.5">{step.date.split(',')[0]}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ReportCard = ({
  report,
  onView,
  onVoiceSummary,
  onSourcePdf,
  isVoiceLoading = false,
  isVoicePlaying = false,
  isSourcePdfLoading = false,
  index
}) => {
  const isReady = report.status === 'Ready';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-3xl border border-gray-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:border-teal-100 transition-all group overflow-hidden relative"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#f0f9f6] rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:bg-[#e8f5f0] transition-colors shadow-sm">
            <FileText size={24} className="text-[#14453d]" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-black text-gray-800 tracking-tight leading-tight mb-1 truncate">{report.testName}</div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-[#14453d]/60 uppercase tracking-widest">{report.labName}</span>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{report.date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Badge status={report.status} />
        </div>
      </div>

      {isReady ? (
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onView(report)}
            className="flex-1 max-w-md flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-[#14453d] to-[#1a5a50] text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-xl shadow-[#14453d]/20 active:scale-95 group"
          >
            <Sparkles size={16} className="text-emerald-400 group-hover:animate-pulse" /> AI DETAILED ANALYSIS
          </button>
          <button
            type="button"
            onClick={() => onVoiceSummary(report)}
            disabled={isVoiceLoading}
            className={`flex-1 max-w-md flex items-center justify-center gap-2.5 py-4 bg-white text-emerald-600 border border-emerald-100 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 group ${isVoiceLoading ? 'opacity-70 cursor-wait' : 'hover:bg-emerald-50 hover:text-emerald-700'} ${isVoicePlaying ? 'bg-emerald-50 text-emerald-700' : ''}`}
          >
            <Volume2 size={16} className={isVoicePlaying ? 'animate-pulse' : 'group-hover:animate-pulse'} /> {isVoiceLoading ? 'PREPARING...' : (isVoicePlaying ? 'STOP VOICE' : 'VOICE SUMMARY')}
          </button>
          <button
            type="button"
            onClick={() => onSourcePdf(report)}
            disabled={isSourcePdfLoading}
            className={`flex-1 max-w-md flex items-center justify-center gap-2.5 py-4 bg-white border border-gray-200 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isSourcePdfLoading ? 'text-gray-500 opacity-80 cursor-wait' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <Download size={16} /> {isSourcePdfLoading ? 'OPENING PDF...' : 'SOURCE PDF'}
          </button>
        </div>
      ) : (
        <ReportTracking report={report} />
      )}
    </motion.div>
  );
};

/** Normalise phone to +91 format for DB lookup */
function normalisePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  return '+' + digits;
}

/** Map DB status values to display values */
function mapStatus(s) {
  if (!s) return 'Pending';
  if (s === 'released') return 'Ready';
  if (s === 'in_review') return 'Processing';
  if (s === 'draft') return 'Processing';
  if (s === 'pending') return 'Pending';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Patient: My Reports tab */
const PatientReports = ({ user, onAnalyze }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [activeReport, setActiveReport] = useState(null);
  const [modalView, setModalView] = useState('list');
  const [analyzingReport, setAnalyzingReport] = useState(null);
  const [voiceLoadingReportId, setVoiceLoadingReportId] = useState(null);
  const [voicePlayingReportId, setVoicePlayingReportId] = useState(null);
  const [sourcePdfLoadingReportId, setSourcePdfLoadingReportId] = useState(null);
  const [audioElements, setAudioElements] = useState([]);
  const voiceSummaryCacheRef = useRef({});

  const buildVoiceSummaryText = (report, detailedReport = null) => {
    const reportInsights = Array.isArray(detailedReport?.report_insights)
      ? (detailedReport.report_insights[0] || {})
      : (detailedReport?.report_insights || {});
    const summary =
      detailedReport?.ai_analysis?.summary ||
      reportInsights?.summary ||
      report?.ai_analysis?.summary ||
      report?.insights?.summary;

    if (typeof summary === 'string' && summary.trim()) {
      return summary.replace(/\s+/g, ' ').trim();
    }

    const values = detailedReport?.test_values || [];
    const outOfRange = values.filter(v => (v?.flag || '').toLowerCase() !== 'normal');

    if (outOfRange.length > 0) {
      const highlighted = outOfRange
        .slice(0, 3)
        .map(v => v?.test_parameters?.name || 'an indicator')
        .join(', ');
      const extra = outOfRange.length > 3 ? ` और ${outOfRange.length - 3} अन्य` : '';
      const plural = outOfRange.length > 1 ? 'पैरामीटर' : 'पैरामीटर';
      return `${report.labName} की ${report.testName} रिपोर्ट में ${outOfRange.length} ${plural} सामान्य सीमा से बाहर हैं, जिनमें ${highlighted}${extra} शामिल हैं। कृपया मेडिकल सलाह के लिए विस्तृत AI विश्लेषण देखें।`;
    }

    return `${report.labName} की ${report.testName} रिपोर्ट, दिनांक ${report.date}, तैयार है। पूरी बायोमार्कर व्याख्या और सुझाव देखने के लिए AI detailed analysis खोलें।`;
  };

  const stopVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioElements.length > 0) {
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      setAudioElements([]);
    }
    setVoicePlayingReportId(null);
  };

  const handleVoiceSummary = async (report) => {
    if (!report?.id) return;
    
    if (voicePlayingReportId === report.id) {
      stopVoice();
      return;
    }

    if (voiceLoadingReportId === report.id) return;

    // Stop any other playing voice
    stopVoice();

    setVoiceLoadingReportId(report.id);
    try {
      const cacheKey = `${report.id}:hi`;
      let summaryText = voiceSummaryCacheRef.current[cacheKey];

      if (!summaryText) {
        // First get the report details to find the summary
        const response = await apiClient.get(`/patient/reports/${report.id}`);
        const detailedReport = response.data?.data;
        summaryText = buildVoiceSummaryText(report, detailedReport);
        voiceSummaryCacheRef.current[cacheKey] = summaryText;
      }

      if (!summaryText) {
        addToast("No summary available for this report.", "error");
        return;
      }

      // Call backend to translate
      const ttsResponse = await apiClient.post('/ai/voice-summary', {
        text: summaryText
      });

      const { hindiText, audioData } = ttsResponse.data;
      
      // Try Browser Speech Synthesis first (much smoother "Neural" girl voices)
      if (typeof window !== 'undefined' && window.speechSynthesis && hindiText) {
        const utterance = new SpeechSynthesisUtterance(hindiText);
        utterance.lang = 'hi-IN';
        
        // Find a smooth female voice
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => 
          v.lang.startsWith('hi') && 
          (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Online')) && 
          (v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Swara') || v.name.includes('Google'))
        ) || voices.find(v => v.lang.startsWith('hi') && (v.name.includes('Female') || v.name.includes('Heera'))) || voices.find(v => v.lang.startsWith('hi'));

        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.pitch = 1.1; // Slightly higher for a younger/clearer girl voice
          utterance.rate = 0.95; // Slightly slower for better clarity and "smoothness"
          
          utterance.onstart = () => setVoicePlayingReportId(report.id);
          utterance.onend = () => setVoicePlayingReportId(null);
          utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            // If synthesis fails, we don't fallback here to avoid overlapping, 
            // but we reset state.
            setVoicePlayingReportId(null);
          };

          window.speechSynthesis.speak(utterance);
          return; // Success with browser voice
        }
      }

      // Fallback to Backend Audio (if browser synthesis unavailable or no Hindi voice found)
      if (audioData && audioData.length > 0) {
        setVoicePlayingReportId(report.id);
        const audios = audioData.map(base64 => new Audio(`data:audio/mp3;base64,${base64}`));
        setAudioElements(audios);
        
        let currentIndex = 0;
        const playNext = () => {
          if (currentIndex < audios.length) {
            audios[currentIndex].play().catch(e => {
              console.error("Playback error:", e);
              setVoicePlayingReportId(null);
            });
            audios[currentIndex].onended = () => {
              currentIndex++;
              playNext();
            };
          } else {
            setVoicePlayingReportId(null);
            setAudioElements([]);
          }
        };
        
        playNext();
      }
    } catch (err) {
      console.error('Voice summary failed:', err);
      addToast("Failed to generate Hindi voice summary. Try again later.", "error");
    } finally {
      setVoiceLoadingReportId(null);
    }
  };

  const handleOpenSourcePdf = async (report) => {
    if (!report?.id) return;
    if (sourcePdfLoadingReportId === report.id) return;

    let popupWindow = null;
    try {
      popupWindow = window.open('about:blank', '_blank');
      if (popupWindow) {
        popupWindow.opener = null;
        popupWindow.document.title = 'Opening report PDF...';
      }
    } catch (_) {
      popupWindow = null;
    }

    setSourcePdfLoadingReportId(report.id);
    try {
      const response = await apiClient.get(`/patient/reports/${report.id}/download`);
      const freshUrl = getPublicUrl(response.data?.url);
      const fallbackUrl = resolveReportPdfUrl(report);
      const targetUrl = freshUrl || fallbackUrl;

      if (!targetUrl) {
        throw new Error('No PDF URL available');
      }

      if (popupWindow) {
        popupWindow.location.assign(targetUrl);
      } else {
        // Fallback if popup blockers deny new tabs after async work.
        window.location.assign(targetUrl);
      }
    } catch (err) {
      console.error('Open source PDF failed:', err);
      if (popupWindow) {
        popupWindow.close();
      }
      let fallbackUrl = resolveReportPdfUrl(report);
      if (!fallbackUrl) {
        try {
          const detailRes = await apiClient.get(`/patient/reports/${report.id}`);
          fallbackUrl = resolveReportPdfUrl(detailRes.data?.data || report);
        } catch (_) {
          // Ignore detail fallback error
        }
      }
      if (fallbackUrl) {
        window.location.assign(fallbackUrl);
      } else {
        alert('PDF is not ready yet. Please try again in a moment.');
      }
    } finally {
      setSourcePdfLoadingReportId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleViewReport = async (report) => {
    setAnalyzingReport(report);
    try {
      // Simulate real-time synthesis delay for "Clinical Engine" feel
      await new Promise(resolve => setTimeout(resolve, 8000));

      const response = await apiClient.get(`/patient/reports/${report.id}`, { params: { lang: 'en' } });
      const data = response.data?.data;

      if (data) {
        const results = (data.test_values || []).map(tv => ({
          name: tv.test_parameters?.name || 'Unknown Parameter',
          value: tv.value,
          unit: tv.test_parameters?.unit || '',
          range: `${tv.test_parameters?.ref_min_male || '—'} - ${tv.test_parameters?.ref_max_male || '—'}`,
          flag: tv.flag || 'normal',
          insight: tv.insight || tv.interpretation || '',
          solution: tv.solution || tv.corrective_action || tv.creativeSolution || '',
          suggested_medicine: tv.suggested_medicine || tv.suggestedMedicine || '',
          suggested_specialist: tv.suggested_specialist || tv.suggestedSpecialist || '',
        }));

        onAnalyze({
          ...report,
          results: results,
          testName: data.test_panels?.name || report.testName,
          patients: data.patients,
          labs: data.labs,
          insights: data.report_insights?.[0] || data.report_insights,
          ai_analysis: data.ai_analysis || null,
          reported_at: data.reported_at,
          pdf_url: data.pdf_url || report.pdf_url,
          source_pdf_url: data.pdf_url || report.pdf_url,
          exact_pdf_url: data.pdf_url || report.pdf_url,
          force_original_pdf_analysis: false,
          referring_doctor: data.referring_doctor
        });
      } else {
        onAnalyze({
          ...report,
          source_pdf_url: report.pdf_url,
          exact_pdf_url: report.pdf_url,
          force_original_pdf_analysis: false,
        });
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      onAnalyze({
        ...report,
        source_pdf_url: report.pdf_url,
        exact_pdf_url: report.pdf_url,
        force_original_pdf_analysis: false,
      });
    } finally {
      setAnalyzingReport(null);
    }
  };

  useEffect(() => {
    async function fetchReportsFromBackend() {
      console.log('--- PatientReports (Backend Proxy) Debug ---');
      try {
        setLoading(true);
        // Call backend API instead of querying protected report tables directly.
        const response = await apiClient.get('/patient/reports');
        const data = response.data?.data || [];

        console.log('Reports from backend:', data);

        // Step 2: normalise shape for UI
        const normalised = data.map(r => {
          // Backend might return lab info in labs or labs!reports_lab_id_fkey
          const lab = r.labs || r['labs!reports_lab_id_fkey'] || {};

          // Transform test_values to results format for ReportModal
          const results = (r.test_values || []).map(tv => ({
            name: tv.test_parameters?.name || 'Unknown Parameter',
            value: tv.value,
            unit: tv.test_parameters?.unit || '',
            range: `${tv.test_parameters?.ref_min_male || '—'} - ${tv.test_parameters?.ref_max_male || '—'}`,
            flag: tv.flag || 'normal',
          }));

          return {
            id: r.id,
            testName: r.test_panels?.name || 'Diagnostic Test',
            category: 'Diagnostics',
            date: r.reported_at
              ? new Date(r.reported_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : new Date(r.collected_at || r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: mapStatus(r.status),
            labName: lab.name || 'City Diagnostics',
            pdf_url: r.pdf_url,
            source_pdf_url: r.pdf_url,
            exact_pdf_url: r.pdf_url,
            share_token: r.share_token,
            uploadedBy: r.lab_staff?.full_name || 'Lab Staff',
            results: results,
            created_at: r.created_at,
            collected_at: r.collected_at,
          };
        });
        setReports(normalised);
      } catch (err) {
        console.error('Failed to fetch reports from backend:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportsFromBackend();
  }, []);


  const tabs = ['All', 'Ready', 'Pending', 'Processing'];
  const visible = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  const stats = {
    total: reports.length,
    ready: reports.filter(r => r.status === 'Ready').length,
    pending: reports.filter(r => r.status === 'Pending').length,
    processing: reports.filter(r => r.status === 'Processing').length,
  };

  return (
    <div className="relative">
      {analyzingReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-black/60 backdrop-blur-md"
           />
           <motion.div
             initial={{ scale: 0.95, opacity: 0, y: 30 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.95, opacity: 0, y: 30 }}
             className="relative z-10 w-full max-w-4xl bg-white rounded-[3.5rem] shadow-[0_50px_150px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
           >
              <AILoaderView report={analyzingReport} />
           </motion.div>
        </div>
      )}

      <div className="space-y-8">
        <h1 className="text-xl font-bold text-gray-800">
          Welcome back, <span style={{ color: PRIMARY }}>{user.name}</span> 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Here's a summary of all your diagnostic reports.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-white' },
          { label: 'Ready', value: stats.ready, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Processing', value: stats.processing, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map(s => (
          <div key={s.label}
            className={`${s.bg} rounded-2xl border border-gray-200 px-4 py-3 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-gray-200 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                    ${filter === t ? 'bg-[#14453d] text-white' : 'text-gray-400 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Report list */}
      <div className="space-y-8">
        {/* Active Tracking */}
        {reports.some(r => r.status !== 'Ready') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock size={16} className="text-amber-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Live Report Tracking</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.filter(r => r.status !== 'Ready').map((r, i) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onView={handleViewReport}
                  onVoiceSummary={handleVoiceSummary}
                  onSourcePdf={handleOpenSourcePdf}
                  isVoiceLoading={voiceLoadingReportId === r.id}
                  isVoicePlaying={voicePlayingReportId === r.id}
                  isSourcePdfLoading={sourcePdfLoadingReportId === r.id}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {/* Report History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle size={16} className="text-emerald-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Released History</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {visible.filter(r => r.status === 'Ready').length > 0
              ? visible.filter(r => r.status === 'Ready').map((r, i) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onView={handleViewReport}
                  onVoiceSummary={handleVoiceSummary}
                  onSourcePdf={handleOpenSourcePdf}
                  isVoiceLoading={voiceLoadingReportId === r.id}
                  isVoicePlaying={voicePlayingReportId === r.id}
                  isSourcePdfLoading={sourcePdfLoadingReportId === r.id}
                  index={i}
                />
              ))
              : (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white
                                rounded-3xl border border-gray-100">
                  <FolderOpen size={32} className="text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-400">No released reports found</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LandscapeReportTracking = ({ report, index, isPlaceholder = false }) => {
  const steps = [
    {
      label: 'Booking',
      date: report.created_at || report.rawDate,
      completed: isPlaceholder ? false : true,
      icon: Plus
    },
    {
      label: 'Sample Collection',
      date: report.collected_at,
      completed: isPlaceholder ? false : (!!report.collected_at || report.status === 'Processing' || report.status === 'Ready'),
      icon: Droplet
    },
    {
      label: 'Test Process Done',
      date: (report.status === 'Processing' || report.status === 'Ready') ? (report.reported_at || report.date) : null,
      completed: isPlaceholder ? false : (report.status === 'Processing' || report.status === 'Ready'),
      icon: RefreshCw
    },
    {
      label: 'Released OK',
      date: report.status === 'Ready' ? (report.reported_at || report.date) : null,
      completed: isPlaceholder ? false : (report.status === 'Ready'),
      icon: Check
    },
  ];

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Pending';
    if (typeof dateVal === 'string' && dateVal.includes(',')) return dateVal;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, day: '2-digit', month: 'short', year: '2-digit' }).replace(',', '');
    } catch {
      return dateVal;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-[2rem] ${isPlaceholder ? '' : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100'} p-6 md:p-10 w-full`}>
      <h3 className="text-xl font-bold text-black mb-12 px-1 tracking-tight text-center md:text-left">{report.testName}</h3>
      <div className="relative w-full">
        <div className="flex items-start justify-between w-full relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isNextCompleted = i < steps.length - 1 && steps[i + 1].completed;

            return (
              <div key={i} className="relative flex flex-col items-center flex-1 text-center">
                {/* Background gray line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[50%] top-[22px] w-full h-[3px] bg-[#eef2fa] z-0" />
                )}
                {/* Animated green line if completed */}
                {i < steps.length - 1 && isNextCompleted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, delay: index * 0.1 + i * 0.25 }}
                    className="absolute left-[50%] top-[22px] h-[3px] bg-[#00c853] z-0 origin-left"
                  />
                )}

                {/* Icon Circle */}
                <div className={`relative z-10 w-11 h-11 mx-auto rounded-full flex items-center justify-center shrink-0 transition-all duration-500
                  ${step.completed
                    ? 'bg-[#00c853] text-white shadow-lg shadow-[#00c853]/20'
                    : 'bg-[#eef2fa] text-[#003b95]'}`}>
                  <Icon size={22} strokeWidth={3} />
                </div>

                {/* Text Content */}
                <div className="pt-4 px-2">
                  <div className="text-[15px] md:text-[17px] font-bold text-black tracking-tight leading-tight mb-1">{step.label}</div>
                  <div className="text-[11px] md:text-[13px] text-gray-500 italic font-medium leading-tight max-w-[120px] mx-auto">
                    {formatDate(step.date)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

/** Patient: Timeline tab */
const PatientTimeline = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState(null);
  const [modalView, setModalView] = useState('list');

  const handleViewReport = (r, view = 'list') => {
    setModalView(view);
    setActiveReport(r);
  };

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const response = await apiClient.get('/patient/reports');
        const data = response.data?.data || [];

        const normalised = data.map(r => {
          const lab = r.labs || r['labs!reports_lab_id_fkey'] || {};
          const results = (r.test_values || []).map(tv => ({
            name: tv.test_parameters?.name || 'Unknown',
            value: tv.value,
            unit: tv.test_parameters?.unit || '',
            range: `${tv.test_parameters?.ref_min_male || '-'} - ${tv.test_parameters?.ref_max_male || '-'}`,
            flag: tv.flag || 'normal',
          }));

          return {
            id: r.id,
            testName: r.test_panels?.name || 'Diagnostic Test',
            category: 'Diagnostics',
            date: r.reported_at
              ? new Date(r.reported_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : new Date(r.collected_at || r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: mapStatus(r.status),
            labName: lab.name || 'City Diagnostics',
            results: results,
            rawDate: r.reported_at || r.collected_at || r.created_at,
            created_at: r.created_at,
            collected_at: r.collected_at,
            reported_at: r.reported_at
          };
        });

        // Sort newest first
        normalised.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        setReports(normalised);
      } catch (err) {
        console.error('Failed to fetch reports for timeline:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();

    // Setup Realtime Subscription to automatically "grow" the flow without refresh
    const reportsChannel = supabase
      .channel('timeline-reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          // Re-fetch reports silently when any update happens to automatically advance the flow
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
    };
  }, []);

  return (
    <>
      <ReportModal report={activeReport} onClose={() => setActiveReport(null)} initialView={modalView} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Track your report</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your complete diagnostic history.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {reports.map((r, i) => (
          <LandscapeReportTracking key={r.id} report={r} index={i} />
        ))}
        {reports.length === 0 && !loading && (
          <div className="mt-4 pointer-events-none">
            <div className="mb-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
              Example Tracking Structure
            </div>
            <LandscapeReportTracking
              report={{
                testName: 'Awaiting Diagnostics Report',
                status: 'Pending',
                created_at: null,
                collected_at: null,
                reported_at: null
              }}
              index={0}
              isPlaceholder={true}
            />
            <p className="text-xs text-center text-gray-400 font-semibold mt-4">
              When the lab processes your report, the green flow will automatically grow here.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export const PatientPortal = () => (
  <Shell
    isPatient={true}
    navItems={[
      { icon: FileText, label: 'My Reports' },
      { icon: Activity, label: 'Track your report' },
      { icon: TrendingUp, label: 'Trends' },
    ]}
    renderContent={(tabIdx, user, search, setAiAnalysis) => {
      if (tabIdx === 0) return <PatientReports user={user} onAnalyze={setAiAnalysis} />;
      if (tabIdx === 1) return <PatientTimeline user={user} />;
      if (tabIdx === 2) return <TrendsView user={user} />;
      return null;
    }}
  />
);

/* ═══════════════════════════════════════════════════════════════════════════
   ② LAB PORTAL — Upload + All Reports
═══════════════════════════════════════════════════════════════════════════ */

/** Lab: Upload tab with drag-and-drop and report form */
const LabUpload = ({ user }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState('Hematology');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    async function fetchPatients() {
      const { data } = await supabase.from('patient').select('id, full_name');
      if (data) {
        setPatients(data);
        if (data.length > 0) setPatientId(data[0].id);
      }
    }
    fetchPatients();
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!testName || !patientId) return;
    setLoading(true);
    try {
      const selectedPatient = patients.find(p => p.id === patientId);
      const payload = {
        patient_id: patientId,
        patient_name: selectedPatient?.full_name || 'Unknown',
        test_name: testName.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'Processing',
        category,
        results: [],
        uploaded_by: user.name,
      };

      // Call server API so it's persisted and potentially triggers logic
      await apiClient.post('/reports', payload);

      setFile(null); setTestName(''); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCls = `w-full text-sm bg-gray-50 border border-gray-200 rounded-xl
                     px-3 py-2.5 outline-none focus:border-[#14453d] transition-all
                     text-gray-700`;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Upload Diagnostic Report</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Upload PDF or image, assign a patient and test name.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5" style={{ height: 'calc(100% - 80px)' }}>

        {/* Drop zone */}
        <div className="flex flex-col gap-3">
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
            onChange={e => setFile(e.target.files[0])} />
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2
                        border-dashed transition-all cursor-pointer p-8 text-center
                        ${isDragging
                ? 'border-[#14453d] bg-[#e8f5f0]'
                : 'border-gray-300 bg-white hover:border-[#14453d]/50 hover:bg-gray-50'}`}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: PRIMARY, boxShadow: '0 8px 24px rgba(20,69,61,0.25)' }}>
              <Upload size={24} className="text-white" />
            </div>
            <div className="text-base font-bold text-gray-700 mb-1.5">
              {file ? file.name : 'Drag & Drop'}
            </div>
            <div className="text-xs text-gray-400">
              {file ? '✓ File ready to submit' : 'or click to browse PDF / image files'}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Report Details</h3>
          <div className="space-y-3 flex-1">

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">
                Patient
              </label>
              <select value={patientId} onChange={e => setPatientId(e.target.value)} className={selectCls}>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">
                Test Name
              </label>
              <select value={testName} onChange={e => setTestName(e.target.value)} className={selectCls}>
                <option value="">Select test…</option>
                {TEST_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">
                Category
              </label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Success toast */}
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50
                                       rounded-xl p-3 border border-emerald-200">
                  <CheckCircle size={14} />
                  <span>Report submitted and marked as Processing.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <TealBtn onClick={handleSubmit} disabled={!testName} className="w-full justify-center mt-4">
            <Plus size={15} /> Submit Report
          </TealBtn>
        </div>
      </div>
    </>
  );
};

/** Lab: All Reports tab */
const LabAllReports = ({ user, search }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await getSupabaseReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      // Call server API to trigger SMTP notification if status is 'Ready'
      await apiClient.patch(`/reports/${id}/status`, { status });
      fetchReports(); // Refresh data
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filtered = reports.filter(r =>
    (r.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.test_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: reports.length,
    ready: reports.filter(r => r.status === 'Ready').length,
    pending: reports.filter(r => r.status === 'Pending').length,
    processing: reports.filter(r => r.status === 'Processing').length,
  };

  return (
    <>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">All Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and update report statuses.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            { label: 'Total', value: stats.total, bg: 'bg-white', color: 'text-gray-700' },
            { label: 'Ready', value: stats.ready, bg: 'bg-emerald-50', color: 'text-emerald-700' },
            { label: 'Pending', value: stats.pending, bg: 'bg-amber-50', color: 'text-amber-700' },
            { label: 'Processing', value: stats.processing, bg: 'bg-teal-50', color: 'text-teal-700' },
          ].map(s => (
            <div key={s.label}
              className={`${s.bg} border border-gray-200 rounded-xl px-3 py-1.5 text-center min-w-[58px]`}>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] uppercase font-bold text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-100">
              {['Patient', 'Test', 'Category', 'Date', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left text-[10px] text-gray-400 font-bold
                                       uppercase tracking-wide px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800 text-sm">{r.patientName}</div>
                  <div className="text-[10px] text-gray-400">ID: {r.patientId}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-[180px]">
                  <div className="truncate">{r.testName}</div>
                </td>
                <td className="px-4 py-3">
                  <CategoryChip label={r.category} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.date}</td>
                <td className="px-4 py-3">
                  <Badge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  {r.status === 'Processing' && (
                    <button onClick={() => updateStatus(r.id, 'Ready')}
                      className="text-xs font-bold text-[#14453d] hover:bg-[#e8f5f0]
                                       px-2.5 py-1 rounded-lg transition-all">
                      Mark Ready
                    </button>
                  )}
                  {r.status === 'Pending' && (
                    <button onClick={() => updateStatus(r.id, 'Processing')}
                      className="text-xs font-bold text-amber-600 hover:bg-amber-50
                                       px-2.5 py-1 rounded-lg transition-all">
                      Start Processing
                    </button>
                  )}
                  {r.status === 'Ready' && (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No reports match your search.</p>
          </div>
        )}
      </div>
    </>
  );
};

export const LabPortal = () => (
  <Shell
    isPatient={false}
    navItems={[
      { icon: Upload, label: 'Upload' },
      { icon: FileText, label: 'All Reports' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search) => {
      if (tabIdx === 0) return <LabUpload user={user} />;
      if (tabIdx === 1) return <LabAllReports user={user} search={search} />;
      return null;
    }}
  />
);

/* ═══════════════════════════════════════════════════════════════════════════
   ③ ADMIN PORTAL — Overview, Users, All Reports
═══════════════════════════════════════════════════════════════════════════ */

/** Admin: Overview tab */
const AdminOverview = () => {
  const reports = getReports();
  const patients = USERS.filter(u => u.role === 'patient');
  const staff = USERS.filter(u => u.role === 'staff');

  const stats = [
    { label: 'Total Users', value: USERS.length, color: 'text-[#14453d]', bg: 'bg-[#e8f5f0]', border: 'border-teal-200' },
    { label: 'Patients', value: patients.length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Lab Staff', value: staff.length, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
    { label: 'Total Reports', value: reports.length, color: 'text-gray-700', bg: 'bg-white', border: 'border-gray-200' },
    { label: 'Ready', value: reports.filter(r => r.status === 'Ready').length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Pending/Process', value: reports.filter(r => r.status !== 'Ready').length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  const recent = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Platform Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">System-wide analytics and activity.</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map(s => (
          <div key={s.label}
            className={`${s.bg} ${s.border} border rounded-2xl px-4 py-3.5`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Recent Report Activity</h3>
        </div>
        <div className="space-y-0">
          {recent.map(r => (
            <div key={r.id}
              className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-7 h-7 bg-[#e8f5f0] rounded-lg flex items-center justify-center shrink-0">
                <FileText size={13} className="text-[#14453d]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-700">{r.testName}</span>
                <span className="text-xs text-gray-400"> — {r.patientName}</span>
              </div>
              <CategoryChip label={r.category} />
              <Badge status={r.status} />
              <span className="text-[10px] text-gray-400">{r.date}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/** Admin: Users tab */
const AdminUsers = ({ search }) => {
  const users = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );
  const roleColors = {
    patient: 'bg-emerald-100 text-emerald-700',
    staff: 'bg-sky-100    text-sky-700',
    admin: 'bg-rose-100   text-rose-700',
  };

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">User Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">All registered users on the platform.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['User', 'Role', 'Email', 'ID'].map(h => (
                <th key={h} className="text-left text-[10px] text-gray-400 font-bold
                                       uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full text-white text-xs font-bold
                                    flex items-center justify-center shrink-0"
                      style={{ background: PRIMARY }}>
                      {u.avatar}
                    </div>
                    <span className="font-semibold text-gray-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize
                                    ${roleColors[u.role] || 'bg-gray-100 text-gray-500'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">
                  {u.email}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{u.id}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/** Admin: Reports tab */
const AdminReports = ({ search }) => {
  const [reports, setReports] = useState(() => getReports());
  const updateStatus = (id, status) => {
    const updated = reports.map(r => r.id === id ? { ...r, status } : r);
    setReports(updated); saveReports(updated);
  };
  const filtered = reports.filter(r =>
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.testName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">All Diagnostic Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Platform-wide report management ({reports.length} total).
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-100">
              {['Patient', 'Test', 'Category', 'Date', 'Uploaded By', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left text-[10px] text-gray-400 font-bold
                                       uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all">
                <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{r.patientName}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  <div className="truncate max-w-[160px]">{r.testName}</div>
                </td>
                <td className="px-4 py-3"><CategoryChip label={r.category} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.date}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.uploadedBy}</td>
                <td className="px-4 py-3"><Badge status={r.status} /></td>
                <td className="px-4 py-3">
                  {r.status !== 'Ready'
                    ? <button onClick={() => updateStatus(r.id, 'Ready')}
                      className="text-xs font-bold text-[#14453d] hover:bg-[#e8f5f0]
                                         px-2.5 py-1 rounded-lg transition-all">
                      Mark Ready
                    </button>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export const AdminPortal = () => (
  <Shell
    isPatient={false}
    navItems={[
      { icon: TrendingUp, label: 'Overview' },
      { icon: Users, label: 'Users' },
      { icon: FileText, label: 'Reports' },
      { icon: Sparkles, label: 'OCR Scanning' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search) => {
      if (tabIdx === 0) return <AdminOverview />;
      if (tabIdx === 1) return <AdminUsers search={search} />;
      if (tabIdx === 2) return <AdminReports search={search} />;
      return <OCRScanningWorkspace user={user} />;
    }}
  />
);

/* ═══════════════════════════════════════════════════════════════════════════
   ④ DOCTOR PORTAL — Patient Reports
═══════════════════════════════════════════════════════════════════════════ */

const DoctorReports = ({ search }) => {
  const [reports] = useState(() => getReports());
  const [activeReport, setActiveReport] = useState(null);
  const [modalView, setModalView] = useState('list');

  const handleViewReport = (r, view = 'list') => {
    setModalView(view);
    setActiveReport(r);
  };

  const filtered = reports.filter(r =>
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.testName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ReportModal report={activeReport} onClose={() => setActiveReport(null)} initialView={modalView} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Patient Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review diagnostic results for your patients.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-100">
              {['Patient', 'Test', 'Category', 'Date', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left text-[10px] text-gray-400 font-bold
                                       uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all">
                <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{r.patientName}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  <div className="truncate max-w-[160px]">{r.testName}</div>
                </td>
                <td className="px-4 py-3"><CategoryChip label={r.category} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.date}</td>
                <td className="px-4 py-3"><Badge status={r.status} /></td>
                <td className="px-4 py-3">
                  <TealBtn size="sm" onClick={() => handleViewReport(r, 'report')} disabled={r.status !== 'Ready'}>
                    <Activity size={12} /> View
                  </TealBtn>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No reports match your search.</p>
          </div>
        )}
      </div>
    </>
  );
};

export const DoctorPortal = () => (
  <Shell
    isPatient={false}
    navItems={[
      { icon: Activity, label: 'Patient Reports' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search) => <DoctorReports search={search} />}
  />
);
