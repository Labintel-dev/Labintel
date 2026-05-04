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
  Minus
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
      font-size: 12pt !important;
    }

    /* Hide UI elements */
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
      break-inside: avoid-page !important;
      page-break-inside: avoid !important;
      margin-bottom: 1.5rem !important;
      display: block !important;
    }

    /* Special handling for tall sections to allow breaking if necessary */
    .interpretation-section, .roadmap-section {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    /* Force horizontal layout in print even for "mobile" widths */
    .flex-print-row {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      gap: 1.5rem !important;
    }

    .flex-print-row > * {
      flex: 1 !important;
    }

    /* Font size overrides for print */
    .print-h1 { font-size: 28pt !important; line-height: 1 !important; }
    .print-h2 { font-size: 24pt !important; line-height: 1 !important; }
    .print-h3 { font-size: 20pt !important; line-height: 1.1 !important; }
    .print-text-lg { font-size: 16pt !important; }
    .print-text-md { font-size: 12pt !important; }
    .print-text-sm { font-size: 10pt !important; }
    
    .print-compact-page {
      page-break-after: always;
      break-after: page;
    }
  }

  /* Support for in-browser PDF-like viewing */
  @media screen {
    .is-print-mode-active {
      background: #525659 !important;
      padding: 40px !important;
      display: flex !important;
      justify-content: center !important;
    }
    .is-print-mode-active .print-view-root {
      position: relative !important;
      display: block !important;
      width: 100% !important;
      max-width: 1200px !important;
      box-shadow: 0 50px 100px rgba(0,0,0,0.3) !important;
      background: white !important;
      border-radius: 40px !important;
      overflow: hidden !important;
    }
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`;


import {
  supabase, getReports as getSupabaseReports,
  getProfile, uploadAvatar,
  TEST_OPTIONS, CATEGORY_OPTIONS
} from '../lib/supabase';
import { getServerHealth, getServerProfile, upsertServerProfile } from '../lib/serverApi';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import AIEngine from '../components/AIEngine';
import TrendsView from '../components/TrendsView';
import OCRScanningWorkspace from '../components/OCRScanningWorkspace';
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
  if (path.startsWith('http') || path.startsWith('/')) return path;
  // Use the environment variable for the Supabase project URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  if (!supabaseUrl) return path;
  return `${supabaseUrl}/storage/v1/object/public/reports/${path}`;
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
    "Header: City Diagnostics Found",
    "Extracted: Hemoglobin 16 g/dL",
    "Extracted: RBC Count 4.5 M/µL",
    "Extracted: Platelets 20000 /µL",
    "Extracted: Hematocrit 70 %",
    "Extracted: MCV 70 fL",
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
        className="w-full max-w-[580px] bg-white rounded-[3rem] shadow-[0_40px_120px_rgba(20,69,61,0.18)] border border-emerald-50 overflow-hidden flex flex-col"
      >
        {/* Top: Holographic Diagnostic Scan */}
        <div className="bg-[#14453d] p-12 flex flex-col items-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           
           {/* Rotating Diagnostic Rings */}
           <div className="relative w-48 h-48 flex items-center justify-center mb-8">
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
                className="w-28 h-28 bg-emerald-400/10 rounded-full flex items-center justify-center relative"
              >
                 <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full" />
                 <Brain size={42} className="text-emerald-400 relative z-10" />
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
              <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-400/60 mb-2">Neural Diagnostic Engine</h2>
              <h1 className="text-2xl font-black text-white uppercase tracking-tightest">Synthesizing Report...</h1>
           </div>
        </div>

        {/* Bottom: Progress & Steps */}
        <div className="p-10 space-y-8">
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
  const abnormalMarkerMap = (Array.isArray(insight.abnormal_markers) ? insight.abnormal_markers : [])
    .reduce((acc, marker) => {
      const key = String(marker?.name || '').toLowerCase();
      if (key) acc[key] = marker;
      return acc;
    }, {});

  const calculateAge = (birthday) => {
    if (!birthday) return '—';
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const criticalResults = results.filter(r => {
    const flag = (r.flag || '').toLowerCase();
    return flag.includes('critical') || flag.includes('abnormal') || flag.includes('low') || flag.includes('high');
  });
  
  const isAllNormal = results.length > 0 && criticalResults.length === 0;

  const getClinicalInsights = () => {
    // 1. Filter out generic or invalid backend summaries
    const rawSummary = insight.summary || "";
    const isGenericError = rawSummary.toLowerCase().includes("could not be generated") || rawSummary.length < 20;
    
    // 2. Map results for easier correlation
    const resultsMap = results.reduce((acc, r) => ({ ...acc, [r.name.toLowerCase()]: r }), {});
    const findVal = (terms) => {
      const key = Object.keys(resultsMap).find(k => terms.some(t => k.includes(t)));
      return key ? parseFloat(resultsMap[key].value) : null;
    };

    // 3. Extract primary biomarkers
    const hgb = findVal(['hemoglobin', 'hgb']);
    const mcv = findVal(['mcv', 'mean corpuscular volume']);
    const platelets = findVal(['platelet']);
    const wbc = findVal(['wbc', 'white blood cell']);
    const glucose = findVal(['glucose', 'fbs', 'sugar']);
    const creatinine = findVal(['creatinine', 'sr. creatinine']);
    const alt = findVal(['alt', 'sgpt']);
    const ldl = findVal(['ldl', 'cholesterol']);

    let problemFound = "";
    let specialistType = insight.specialist_type || "Clinical Pathologist";

    // 4. Advanced Clinical Correlation Engine
    if (hgb !== null && hgb < 12) {
      if (mcv !== null && mcv < 80) problemFound = "Microcytic Hypochromic Anemia (Iron Deficiency Pattern)";
      else if (mcv !== null && mcv > 100) problemFound = "Macrocytic Anemia (Megaloblastic Pattern)";
      else problemFound = "Normocytic Anemia (Chronic Disease Pattern)";
      specialistType = "Hematologist";
    } 
    else if (glucose !== null && glucose > 125) {
      problemFound = "Hyperglycemia (Prediabetic/Diabetic Metabolic Pattern)";
      specialistType = "Endocrinologist";
    }
    else if (creatinine !== null && creatinine > 1.2) {
      problemFound = "Renal Filtration Deviation (Glomerular Stress Pattern)";
      specialistType = "Nephrologist";
    }
    else if (platelets !== null && platelets < 150) {
      problemFound = "Thrombocytopenia (Coagulation Risk Pattern)";
      specialistType = "Hematologist";
    }
    else if (alt !== null && alt > 45) {
      problemFound = "Hepatic Enzyme Elevation (Liver Stress Pattern)";
      specialistType = "Gastroenterologist";
    }
    else if (ldl !== null && ldl > 130) {
      problemFound = "Dyslipidemia (Atherogenic Cardiovascular Risk)";
      specialistType = "Cardiologist";
    }
    else if (criticalResults.length > 0) {
      problemFound = `${criticalResults[0].name} Clinical Deviation`;
    }

    if (!problemFound) problemFound = isAllNormal ? "Physiological Homeostasis" : "Sub-clinical Metabolic Shift";

    // 5. Smart Synthesis Narrator (v6.0)
    const buildAdvancedSummary = () => {
      if (isAllNormal) {
        return "Biological Neural Synthesis confirms strict alignment with standardized physiological reference intervals. Oxygen-carrying capacity, renal filtration, and immunological markers demonstrate optimal homeostasis. No immediate clinical intervention is suggested from the current biomarker set.";
      }

      const findings = criticalResults.slice(0, 3).map(r => r.name).join(", ");
      const severity = criticalResults.length > 3 ? "Multifaceted" : "Targeted";
      
      return `AI Neural Synthesis has identified a ${severity} biomarker deviation within your clinical profile, primarily involving ${findings}. This specific signature—notably the ${problemFound}—suggests an active metabolic or physiological shift that requires expert correlation. We recommend assessing current hydration, dietary precursors, and systemic stress markers. Immediate consultation with a ${specialistType} is prioritized to integrate these neural findings with your broader clinical history and prevent potential physiological progression.`;
    };

    return {
      problem: problemFound,
      solution: insight.recommendations?.[0] || "Expert clinical correlation and diagnostic follow-up is mandatory.",
      specialist: specialistType,
      summary: isGenericError ? buildAdvancedSummary() : rawSummary,
      recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : [],
      medicinePlan: Array.isArray(insight.medicine_plan) ? insight.medicine_plan : [],
    };
  };

  const clinical = getClinicalInsights();
  const healthScore = Math.min(99, Math.max(20, Math.round((isAllNormal ? 95 : 75) - (criticalResults.length * 5))));
  const healthLabel = healthScore >= 85 ? 'GOLD STANDARD STABILITY' : healthScore > 70 ? 'STABLE' : 'ACTION REQUIRED';

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const patientName = (data.patientInfo?.name || data.patient_name || 'Sayantan Maji').toUpperCase();
  const patientIdLabel = data.patient_code || data.lab_patient_code || data.patient_display_id || 'LAB-123';
  const patientGender = (data.patients?.gender || data.patientInfo?.gender || 'male').toLowerCase();
  const patientAge = data.patients?.date_of_birth ? calculateAge(data.patients.date_of_birth) : (data.patientInfo?.age || '21');
  const referringDoctor = (data.referring_doctor || 'Dr. Roy (Recovered)').toUpperCase();
  const reportRef = `#${String(data.id || 'A59BE841').slice(0, 8).toUpperCase()}`;
  const releaseDate = formatDate(data.reported_at || data.date || '2026-05-02');
  const collectionDate = formatDate(data.collected_at || data.reported_at || data.date || '2026-05-02');
  const specialistRecommended = clinical.specialist || 'Clinical Pathologist';
  const roadmapSteps = clinical.recommendations?.length
    ? clinical.recommendations.slice(0, 3)
    : [
        'Consult your doctor with this complete report.',
        'Start focused lifestyle corrections and monitoring.',
        'Repeat abnormal markers as advised for trend validation.',
      ];
  const medicineLine = clinical.medicinePlan?.[0] || 'General corrective medicine planning as advised by your doctor.';
  const abnormalRows = results.filter((r) => String(r.flag || '').toLowerCase() !== 'normal');
  const technicianName = data.technician_name || data.created_by || data.lab_staff?.full_name || 'Ananya Bose';
  const fingerprint = String(data.id || 'BKMRF9A8A-OVA8T9M8E').toUpperCase().slice(0, 24);
  const riskLevel = criticalResults.length > 3 ? 'CRITICAL' : criticalResults.length > 0 ? 'HIGH' : 'LOW';
  const severityColor = riskLevel === 'CRITICAL' ? 'text-rose-600' : riskLevel === 'HIGH' ? 'text-amber-600' : 'text-emerald-600';

  if (compact) {
    const renderPageHeader = () => (
      <div className="rounded-[32px] border-2 border-emerald-50/50 p-8 bg-white shadow-sm mb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-emerald-100 bg-white p-3 shadow-lg">
              <img src="/logo.jpg" alt="Labintel" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[48px] leading-none font-black tracking-tighter text-[#14453d] uppercase">LABINTEL</h1>
                <span className="px-3 py-1 rounded-lg border-2 border-emerald-200 bg-emerald-50 text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] shadow-sm">Verified</span>
              </div>
              <p className="text-[10px] mt-2 font-black uppercase tracking-[0.35em] text-emerald-600/60 italic leading-none">Precision Diagnostics & Neural Analysis</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#14453d] leading-tight">Labintel Diagnostics<br/>Systems</p>
            <div className="mt-2 flex items-center justify-end gap-2 text-[9px] font-bold text-slate-400">
              <Mail size={10} className="text-[#14453d]" />
              <span>contact.labintel@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="text-[#0f2747] font-serif bg-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        {/* PAGE 1: HEADER & PATIENT INFO & SUMMARY */}
        <div className="bg-white p-6 w-full flex flex-col relative overflow-hidden" style={{ pageBreakAfter: 'auto', breakAfter: 'auto' }}>
          <div className="absolute top-0 right-0 w-[40%] h-[20%] bg-gradient-to-bl from-emerald-50/50 to-transparent -z-10 rounded-bl-[10rem]" />
          
          {renderPageHeader()}

          <div className="rounded-[24px] border-2 border-emerald-50/50 p-6 bg-white shadow-sm mb-4">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 pr-6 border-r-2 border-emerald-50/50">
                <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Patient Name</p>
                    <p className="text-[28px] leading-none font-black text-[#0f2747] uppercase tracking-tighter">{patientName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Patient ID (PID)</p>
                    <p className="text-[28px] leading-none font-black text-[#0f2747] uppercase tracking-tighter">{patientIdLabel}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-8">
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Gender / Age</p>
                       <p className="text-[20px] leading-none font-black text-[#14453d]">{patientGender} / {patientAge} Yrs</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Referring Physician</p>
                       <p className="text-[20px] leading-none font-black text-[#0f2747] italic uppercase tracking-tighter">{referringDoctor}</p>
                     </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Collection Date</p>
                    <p className="text-[18px] leading-none font-black text-[#0f2747]">{collectionDate}</p>
                  </div>
                </div>
                <div className="mt-6 rounded-[20px] border-2 border-rose-100 bg-rose-50/40 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-rose-500 border border-rose-100 shadow-sm">
                      <Stethoscope size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-rose-400">Specialist Recommended</p>
                      <p className="text-[18px] leading-none mt-0.5 font-black text-[#0f2747] uppercase">{specialistRecommended}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50/30 p-3 border border-emerald-100">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-400 mb-0.5">Report Ref</p>
                    <p className="text-[16px] font-black text-[#0f2747]">{reportRef}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/30 p-3 border border-emerald-100">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-400 mb-0.5">Release Date</p>
                    <p className="text-[16px] font-black text-[#0f2747]">{releaseDate}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-400 mb-2">Status</p>
                  <div className="inline-flex w-full justify-center py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                    FINAL VERIFIED
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[32px] border-2 border-emerald-100 bg-[#f9fbfb] relative overflow-hidden shadow-sm mb-6">
             <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100/20 rounded-bl-full -z-10" />
             <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-[#14453d] rounded-lg text-emerald-400 shadow-md">
                   <Activity size={16} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#14453d]">Neural Interpretation Summary</h3>
             </div>
             <p className="text-[16px] font-bold leading-relaxed text-slate-700 italic antialiased print:text-[12pt]">
                <span className="text-3xl font-black text-[#14453d] mr-2 float-left leading-none mt-1">"</span>
                {clinical.summary}
             </p>
          </div>

          <div className="rounded-[32px] border-2 border-emerald-50 overflow-hidden shadow-sm bg-white mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-500 text-white">
                  <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-4 px-5">Investigation Marker</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-4 px-4">Result</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-4 px-4">Reference</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-[0.2em] py-4 px-5">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-emerald-50">
                {results.map((r, idx) => {
                  const abnormal = String(r.flag || '').toLowerCase() !== 'normal';
                  return (
                    <tr key={idx} className={`transition-all ${abnormal ? 'bg-rose-50/40' : ''}`}>
                      <td className="px-5 py-3 text-[12px] font-black text-gray-800 uppercase tracking-tight">{r.name}</td>
                      <td className="px-4 py-3">
                         <span className={`text-[14px] font-black ${abnormal ? 'text-rose-600' : 'text-emerald-700'}`}>{r.value}</span>
                         <span className="ml-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{r.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] font-bold text-slate-400 italic">{r.range}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-[0.1em] border
                          ${abnormal ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {abnormal ? `${r.flag || 'Abnormal'}` : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {abnormalRows.length > 0 && (
            <div className="p-6 rounded-[32px] border-4 border-rose-100 bg-rose-50/30 relative overflow-hidden shadow-sm mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-800 mb-4 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                Diagnostic Protocol
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {abnormalRows.slice(0, 3).map((row, idx) => {
                  const markerDetail = abnormalMarkerMap[String(row.name || '').toLowerCase()] || {};
                  return (
                    <div key={idx} className="bg-white rounded-[20px] p-4 border border-rose-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[16px] font-black text-rose-800 uppercase tracking-tight">{row.name}</h4>
                        <div className="px-3 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-[7px] font-black uppercase tracking-widest border border-rose-100">
                          CRITICAL
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[9px] leading-tight">
                        <p className="text-slate-600"><span className="font-black text-rose-600 uppercase mr-1">Solution:</span> {row.solution || markerDetail.solution || 'Immediate clinical review.'}</p>
                        <p className="text-slate-600"><span className="font-black text-rose-600 uppercase mr-1">Medicine:</span> {row.suggested_medicine || markerDetail.suggested_medicine || 'As advised by doctor.'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <div className="p-6 rounded-[32px] border-4 border-emerald-50 bg-[#f9fcfb] shadow-inner">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <p className="text-[8px] font-black uppercase text-emerald-400 tracking-[0.2em]">Instrumentation</p>
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#14453d]" />
                    <p className="text-[10px] font-black text-[#0f2747] uppercase leading-none">Analyzer v5.0</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase text-emerald-400 tracking-[0.2em]">Technician</p>
                  <p className="text-[20px] leading-none font-black text-[#14453d] uppercase tracking-tighter mt-1">{technicianName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-emerald-400 tracking-[0.2em]">Standard</p>
                  <p className="text-[10px] font-bold text-slate-400 italic">CLSI-2026</p>
                </div>
              </div>

              <div className="my-4 h-px bg-emerald-100" />

              <div className="rounded-[20px] border border-rose-200/50 bg-rose-50/30 p-5 text-center">
                 <p className="text-[8px] font-black text-rose-900/40 uppercase tracking-[0.4em] mb-2">Mandatory AI Notice</p>
                 <p className="text-[10px] font-bold text-rose-900/60 uppercase leading-tight tracking-tighter italic">
                   AI ANALYSIS: THIS SYNTHESIS IS FOR GUIDANCE ONLY AND MUST BE CONFIRMED BY A CERTIFIED MEDICAL PROFESSIONAL.
                 </p>
              </div>
               </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
            <span>Labintel Clinical Engine v2.0</span>
            <span>Page 02 of 02</span>
          </div>
        </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 font-serif w-full max-w-[1400px] mx-auto print:w-[210mm] print:m-0 print:border-0 overflow-visible" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <div className="p-8 sm:p-14 md:p-20 lg:p-[4vw] print:p-10 relative w-full overflow-visible flex flex-col gap-8">
        
        {/* 1. INSTITUTIONAL HEADER (NABL CERTIFIED) */}
        <div className="flex items-start justify-between border-b-4 border-[#14453d] pb-8 print:pb-6">
           <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl border-2 border-emerald-100">
                 <img src="/logo.jpg" alt="Labintel" className="w-full h-full object-contain" />
              </div>
              <div>
                 <div className="flex items-center gap-4">
                    <h1 className="text-[56px] leading-none font-black text-[#14453d] tracking-tightest uppercase">LABINTEL</h1>
                    <div className="flex flex-col">
                       <span className="px-3 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-700 uppercase tracking-widest">VERIFIED ASSET</span>
                       <span className="text-[10px] font-black text-[#14453d] uppercase tracking-[0.2em] mt-1">NABL ACCREDITED</span>
                    </div>
                 </div>
                 <p className="mt-3 text-[14px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Precision Neural Diagnostics & Bio-Analysis</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[12px] font-black text-[#14453d] uppercase tracking-[0.4em] leading-tight mb-2">LABINTEL DIAGNOSTIC SYSTEMS</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Digital HQ: contact.labintel@gmail.com</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Asset Ref: {fingerprint.slice(0, 12)}</p>
              <div className="mt-4 flex justify-end">
                 <div className="w-16 h-16 border-2 border-gray-100 rounded-xl flex items-center justify-center bg-gray-50/50">
                    <div className="w-12 h-12 border border-gray-200 rounded flex flex-wrap p-1 opacity-20">
                       {[...Array(16)].map((_, i) => <div key={i} className="w-2 h-2 bg-gray-400 m-0.5" />)}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. PATIENT & REPORT METADATA GRID */}
        <div className="grid grid-cols-12 gap-8 bg-slate-50/30 rounded-[2.5rem] border-2 border-slate-50 p-10 print:p-8">
           <div className="col-span-8 grid grid-cols-2 gap-x-12 gap-y-10">
              <div>
                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Patient Full Name</p>
                 <p className="text-[38px] leading-none font-black text-[#0f2747] uppercase tracking-tightest">{patientName}</p>
              </div>
              <div>
                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Patient ID (PID)</p>
                 <p className="text-[38px] leading-none font-black text-[#0f2747] uppercase tracking-tightest">{patientIdLabel}</p>
              </div>
              <div className="col-span-2 flex items-center gap-20">
                 <div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Age / Gender</p>
                    <p className="text-[28px] leading-none font-black text-[#14453d] uppercase">{patientAge} Yrs / {patientGender}</p>
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Referring Doctor</p>
                    <p className="text-[28px] leading-none font-black text-[#0f2747] italic uppercase tracking-tighter">{referringDoctor}</p>
                 </div>
              </div>
              <div className="flex items-center gap-10">
                 <div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Collection Date</p>
                    <p className="text-[22px] font-black text-[#0f2747]">{collectionDate}</p>
                 </div>
                 <div className="h-10 w-px bg-slate-200" />
                 <div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Report Release</p>
                    <p className="text-[22px] font-black text-[#0f2747]">{releaseDate}</p>
                 </div>
              </div>
           </div>
           <div className="col-span-4 flex flex-col justify-between items-end text-right">
              <div className="space-y-4 w-full">
                 <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Digital Signature</p>
                    <p className="text-[18px] font-black text-[#14453d] tracking-widest">{reportRef}</p>
                 </div>
                 <div className="p-5 rounded-2xl bg-[#14453d] text-white shadow-xl">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Asset Status</p>
                    <p className="text-[16px] font-black uppercase tracking-[0.3em]">FINAL VERIFIED</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 3. NEURAL INTERPRETATION SUMMARY */}
        <div className="bg-white rounded-[3rem] border-2 border-gray-100 p-12 relative overflow-hidden shadow-sm" style={{ breakInside: 'avoid' }}>
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-50/20 rounded-bl-full -z-10" />
           <div className="flex items-center gap-6 mb-10">
              <div className="p-3.5 bg-[#14453d] rounded-2xl text-emerald-400 shadow-xl">
                 <Activity size={28} />
              </div>
              <div>
                 <h3 className="text-[16px] font-black uppercase tracking-[0.5em] text-[#14453d] leading-none mb-2">Clinical Diagnostic Summary</h3>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Neural Interpretation of Pathological Markers</p>
              </div>
           </div>
           
           <p className="text-[22px] sm:text-[26px] font-bold leading-relaxed text-slate-800 italic antialiased mb-12">
              <span className="text-6xl font-black text-[#14453d] mr-5 float-left leading-none mt-2">"</span>
              {clinical.summary}
           </p>

           <div className="grid grid-cols-3 gap-8 pt-12 border-t-2 border-gray-50">
              <div className="p-8 rounded-3xl bg-rose-50 border-2 border-rose-100">
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-400 mb-3">Overall Risk</p>
                 <p className={`text-[36px] font-black ${severityColor} uppercase tracking-tightest`}>{riskLevel}</p>
              </div>
              <div className="p-8 rounded-3xl bg-blue-50 border-2 border-blue-100">
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 mb-3">Detected Pattern</p>
                 <p className="text-[18px] font-black text-[#0f2747] uppercase leading-tight tracking-tight">{clinical.problem}</p>
              </div>
              <div className="p-8 rounded-3xl bg-emerald-50 border-2 border-emerald-100">
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-3">Primary Referral</p>
                 <p className="text-[22px] font-black text-[#14453d] uppercase leading-tight tracking-tight">{clinical.specialist}</p>
              </div>
           </div>
        </div>

        {/* 4. COMPREHENSIVE BIOMARKER TABLE */}
        <div className="rounded-[3rem] border-2 border-gray-100 overflow-hidden shadow-sm" style={{ breakInside: 'avoid' }}>
           <div className="bg-slate-50 px-12 py-6 border-b-2 border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-2.5 h-7 bg-[#14453d] rounded-full" />
                 <h3 className="text-[14px] font-black uppercase tracking-[0.5em] text-[#14453d]">Detailed Biomarker Analysis</h3>
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{results.length} Parameters Scanned</span>
           </div>
           <table className="w-full">
              <thead>
                 <tr className="bg-white border-b-2 border-gray-50">
                    <th className="text-left text-[12px] font-black uppercase tracking-[0.3em] text-slate-300 py-8 px-12">Investigation Marker</th>
                    <th className="text-left text-[12px] font-black uppercase tracking-[0.3em] text-slate-300 py-8 px-6">Detected Result</th>
                    <th className="text-left text-[12px] font-black uppercase tracking-[0.3em] text-slate-300 py-8 px-6">Reference Range</th>
                    <th className="text-right text-[12px] font-black uppercase tracking-[0.3em] text-slate-300 py-8 px-12">Clinical Flag</th>
                 </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-50">
                 {results.map((r, i) => {
                    const isAbnormal = (r.flag || '').toLowerCase() !== 'normal';
                    return (
                       <tr key={i} className={`group transition-all ${isAbnormal ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                          <td className="py-6 px-12 text-[16px] font-black text-[#0f2747] uppercase tracking-tight">{r.name}</td>
                          <td className="py-6 px-6">
                             <span className={`text-[22px] font-black ${isAbnormal ? 'text-rose-600' : 'text-emerald-700'}`}>{r.value}</span>
                             <span className="ml-2 text-[11px] font-bold text-slate-400 uppercase">{r.unit}</span>
                          </td>
                          <td className="py-6 px-6 text-[14px] font-bold text-slate-400 italic">{r.range}</td>
                          <td className="py-6 px-12 text-right">
                             <span className={`inline-flex px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2
                                ${isAbnormal ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {isAbnormal ? r.flag.toUpperCase() : 'NORMAL'}
                             </span>
                          </td>
                       </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>

        {/* 5. ABNORMAL MARKER CLINICAL PROTOCOL */}
        {abnormalRows.length > 0 && (
          <div className="flex flex-col gap-10" style={{ breakInside: 'avoid' }}>
             <div className="flex items-center gap-6">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 border border-rose-100">
                   <AlertCircle size={28} />
                </div>
                <div>
                   <h3 className="text-[16px] font-black uppercase tracking-[0.5em] text-rose-800 leading-none mb-2">Abnormal Diagnostic Protocol</h3>
                   <p className="text-[11px] font-bold text-rose-400 uppercase tracking-[0.2em]">Mandatory Clinical Guidance for Deviant Markers</p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-rose-100 to-transparent" />
             </div>

             <div className="grid grid-cols-1 gap-8">
                {abnormalRows.map((row, idx) => {
                   const markerDetail = abnormalMarkerMap[String(row.name || '').toLowerCase()] || {};
                   return (
                      <div key={idx} className="bg-white rounded-[3rem] p-12 border-2 border-rose-100 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                         <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[24px] font-black text-rose-800 uppercase tracking-tightest">{row.name}</h4>
                            <div className="px-5 py-1.5 rounded-xl bg-rose-500 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg shadow-rose-500/20">
                               CRITICAL ACTION
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-12 text-[14px] leading-relaxed">
                            <div className="space-y-6">
                               <p><span className="text-rose-600 font-black uppercase block text-[10px] tracking-[0.3em] mb-2">Clinical Explanation:</span> {row.insight || markerDetail.explanation || 'Significant deviation detected. Professional review mandatory.'}</p>
                               <p><span className="text-rose-600 font-black uppercase block text-[10px] tracking-[0.3em] mb-2">Immediate Solution:</span> {row.solution || markerDetail.solution || 'Consult with your physician immediately.'}</p>
                            </div>
                            <div className="space-y-6">
                               <p><span className="text-rose-600 font-black uppercase block text-[10px] tracking-[0.3em] mb-2">Suggested Medicine:</span> {row.suggested_medicine || markerDetail.suggested_medicine || 'As per doctor\'s prescription only.'}</p>
                               <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recommended specialist</p>
                                  <p className="text-[18px] font-black text-[#14453d] uppercase tracking-tight">{row.suggested_specialist || clinical.specialist}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>
        )}

        {/* 6. FINAL VERIFICATION & LEGAL DISCLOSURES */}
        <div className="mt-10 p-12 rounded-[3rem] border-2 border-gray-100 bg-[#f9fbfb]" style={{ breakInside: 'avoid' }}>
           <div className="grid grid-cols-3 gap-16 mb-16">
              <div className="space-y-8">
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Laboratory Metadata</p>
                 <div className="flex items-start gap-5">
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xl text-gray-400">
                       <Cpu size={28} />
                    </div>
                    <div>
                       <p className="text-[16px] font-black text-[#0f2747] uppercase leading-tight tracking-tight">Hematology Analyzer v5.2</p>
                       <p className="text-[11px] font-bold text-emerald-600 uppercase mt-2 tracking-[0.2em] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          INTERNAL QC: PASSED
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center space-y-6">
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Final Verification</p>
                 <div className="relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-20 rotate-12">
                       <img src="/signature.png" alt="Signature" className="h-20 grayscale" />
                    </div>
                    <p className="text-[32px] font-black text-[#14453d] uppercase tracking-tightest leading-none mb-2">{technicianName}</p>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Chief Clinical Pathologist</p>
                 </div>
              </div>

              <div className="text-right space-y-8">
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Institutional Validation</p>
                 <p className="text-[14px] font-bold text-slate-400 italic leading-relaxed uppercase tracking-tight">
                    This report is digitally signed and validated under CLSI-2026 protocols for male adult cohorts.
                 </p>
              </div>
           </div>

           <div className="h-px bg-slate-200 mb-10" />
           
           <div className="rounded-[3rem] border border-rose-200/50 bg-rose-50/30 p-12 text-center" style={{ breakInside: 'avoid' }}>
              <h4 className="text-[11px] font-black text-rose-900/40 uppercase tracking-[1em] mb-6">M A N D A T O R Y   M E D I C A L   D I S C L A I M E R</h4>
              <p className="text-[13px] font-bold text-rose-900/70 uppercase leading-relaxed tracking-tight max-w-5xl mx-auto">
                AI ANALYSIS NOTICE: THIS REPORT IS SYNTHESIZED USING ADVANCED NEURAL PROCESSING FOR INFORMATIONAL GUIDANCE ONLY. IT DOES NOT REPLACE A FORMAL PHYSICIAN'S DIAGNOSIS. ALL CLINICAL DECISIONS MUST BE BASED ON THE REVIEW OF THIS DATA BY A BOARD-CERTIFIED MEDICAL PROFESSIONAL.
              </p>
           </div>
        </div>

        {/* 7. ASSET FINGERPRINT & VERSIONING */}
        <div className="flex justify-between items-center text-[11px] font-black text-slate-200 uppercase tracking-[0.5em] pt-4">
           <span>Labintel Clinical Engine v2.0.4</span>
           <span className="opacity-40">Asset Fingerprint: {fingerprint}</span>
        </div>
      </div>
    </div>
  );
};

const ReportModal = ({ report, onClose }) => {
  const [fullReport, setFullReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('ai'); // 'ai' or 'original'
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
          className="bg-white w-[95vw] h-[92vh] max-w-[1600px] rounded-[3.5rem] overflow-hidden flex flex-col no-print shadow-[0_50px_150px_rgba(0,0,0,0.35)] border border-white/20 relative"
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

          <div className="flex-1 overflow-auto bg-slate-100/50 p-4 sm:p-12 print-content-wrap">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center no-print">
                 <AILoaderView report={report} onSkip={() => setLoading(false)} />
              </div>
            ) : viewMode === 'original' ? (
              <div className="h-full w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <iframe 
                  src={fullReportPdfUrl || ''} 
                  className="w-full h-full border-none"
                  title="Original Lab Report"
                />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="flex justify-center w-full"
              >
                <div className="w-full max-w-[1300px] shadow-2xl transition-all duration-500 print-report-canvas">
                  <AIReportPrintView data={fullReport} />
                </div>
              </motion.div>
            )}
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
  <div className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col no-print">
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

const ProfileUpdateModal = ({ user, onClose, onUpdated }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [dob, setDob] = useState(user.dob || '');
  const [email, setEmail] = useState(user.email || '');
  const [gender, setGender] = useState(user.gender || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user.avatar_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const calculateAge = (birthday) => {
    if (!birthday) return '';
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let avatar_url = user.avatar_url;
      if (file) {
        avatar_url = await uploadAvatar(user.id, file);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || useAuthStore.getState().token;

      if (!token) throw new Error("No active session found");

      const response = await upsertServerProfile(token, {
        full_name: name,
        phone,
        dob,
        email,
        gender,
        avatar_url
      });

      if (response && response.data) {
        const currentUser = useAuthStore.getState().user;
        const currentLab = useAuthStore.getState().lab;
        useAuthStore.getState().setAuth(token, {
          ...currentUser,
          ...response.data,
          avatar_url
        }, currentLab);
      }

      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/20"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Update Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              {preview ? (
                <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md grayscale-[0.5]" style={{ background: PRIMARY }}>
                  {user.avatar}
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="mt-2 text-xs text-gray-400 font-medium">Click to change profile picture</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                  placeholder="+91 00000-00000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Gender</label>
                <div className="relative">
                  <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none appearance-none bg-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Date of Birth</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Calculated Age</label>
                <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 font-semibold">
                  {calculateAge(dob) || '--'} years
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs font-bold text-center mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 bg-[#14453d] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#14453d]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Update Profile'}
          </button>
        </form>
      </motion.div>
    </div>
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
const Shell = ({ navItems, showSearch = false, renderContent }) => {
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

  const authStoreUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

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
        className="dashboard-shell relative z-10 flex min-h-screen w-full overflow-hidden bg-white"
        style={{
          boxShadow: 'none',
        }}
      >
        <Sidebar navItems={navItems} activeIdx={activeIdx}
          setActiveIdx={(i) => { setActiveIdx(i); setSearch(''); setShowAiEngine(false); setAiAnalysis(null); }}
          user={user}
          onLogout={onLogout}
          className="dashboard-sidebar no-print" />

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
          <div className="dashboard-scroll flex-1 overflow-auto p-6" style={{ background: '#f8faf9' }}>
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
              <div className="flex flex-col gap-8 pb-20">
                <div className="flex items-center justify-between px-4 sm:px-8">
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
                
                <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-10">
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
              renderContent(activeIdx, user, search, (data) => {
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
              })
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

const ReportCard = ({ report, onView, index }) => {
  const isReady = report.status === 'Ready';
  const sourcePdfUrl = resolveReportPdfUrl(report);

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
          {isReady && (
            <div className="hidden sm:flex items-center gap-2">
               <div className="w-px h-8 bg-gray-100 mx-2" />
               <button 
                 onClick={() => onView(report, 'report')}
                 className="p-2.5 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                 title="View AI Report"
               >
                 <Sparkles size={18} />
               </button>
            </div>
          )}
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
          <a
            href={sourcePdfUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!sourcePdfUrl) e.preventDefault();
            }}
            className="flex-1 max-w-md flex items-center justify-center gap-2.5 py-4 bg-white text-gray-400 border border-gray-200 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95"
          >
            <Download size={16} /> SOURCE PDF
          </a>
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

  const handleViewReport = async (report) => {
    setAnalyzingReport(report);
    try {
      // Simulate real-time synthesis delay for "Clinical Engine" feel
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      const response = await apiClient.get(`/patient/reports/${report.id}`);
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
                <ReportCard key={r.id} report={r} onView={handleViewReport} index={i} />
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
                <ReportCard key={r.id} report={r} onView={handleViewReport} index={i} />
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
    navItems={[
      { icon: FileText, label: 'My Reports' },
      { icon: Activity, label: 'Track your report' },
      { icon: TrendingUp, label: 'Trends' },
      { icon: Sparkles, label: 'OCR Scanning' },
    ]}
    renderContent={(tabIdx, user, search, setAiAnalysis) => {
      if (tabIdx === 0) return <PatientReports user={user} onAnalyze={setAiAnalysis} />;
      if (tabIdx === 1) return <PatientTimeline user={user} />;
      if (tabIdx === 2) return <TrendsView user={user} />;
      return <OCRScanningWorkspace user={user} />;
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
    navItems={[
      { icon: Upload, label: 'Upload' },
      { icon: FileText, label: 'All Reports' },
      { icon: Sparkles, label: 'OCR Scanning' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search) => {
      if (tabIdx === 0) return <LabUpload user={user} />;
      if (tabIdx === 1) return <LabAllReports user={user} search={search} />;
      return <OCRScanningWorkspace user={user} />;
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
    navItems={[
      { icon: Activity, label: 'Patient Reports' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search) => <DoctorReports search={search} />}
  />
);
