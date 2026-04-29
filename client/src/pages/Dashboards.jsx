import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate }       from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import {
  Beaker, LogOut, Bell, User, FileText,
  Upload, Download, X,
  ShieldCheck, Users, TrendingUp, CheckCircle,
  Search, Activity, Clock, AlertCircle, Plus,
  Stethoscope, Sparkles, Camera, ChevronRight, FolderOpen, ArrowLeft,
  Mail, Settings, Phone, Calendar, Loader2, MessageSquare,
  LayoutDashboard, FileUp
} from 'lucide-react';
import { 
  supabase, getReports as getSupabaseReports, 
  getProfile, uploadAvatar,
  TEST_OPTIONS, CATEGORY_OPTIONS 
} from '../lib/supabase';
import { getServerHealth, getServerProfile, upsertServerProfile } from '../lib/serverApi';
import apiClient from '../services/apiClient';
import AIEngine from '../components/AIEngine';
import MedicalReportView from '../components/MedicalReportView';
import TrendsView from '../components/TrendsView';
import OCRScanningWorkspace from '../components/OCRScanningWorkspace';
import {
  getUser, clearUser, getReports, saveReports, USERS,
} from '../data/mockData';
import { normalizeAnalysis, isAiCapacityError, buildAiCapacityFallbackPayload } from '../lib/normalization';
import { chooseAnalysisSpeed } from '../lib/analysisSpeed';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const PRIMARY = '#14453d';
const processingSteps = [
  "Securely reading report file...",
  "Extracting clinical biomarkers...",
  "AI synthesis & risk assessment..."
];

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
═══════════════════════════════════════════════════════════════════════════ */

/** Status badge */
const Badge = ({ status }) => {
  const map = {
    Ready:      'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pending:    'bg-amber-100   text-amber-700   border-amber-200',
    Processing: 'bg-teal-100    text-teal-700    border-teal-200',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5
                      rounded-full border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status === 'Ready'      && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
      {status === 'Pending'    && <span className="w-1.5 h-1.5 rounded-full bg-amber-500   mr-1.5" />}
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

/* ═══════════════════════════════════════════════════════════════════════════
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
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${
      type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
      type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' :
      'bg-gray-50 border-gray-100 text-gray-800'
    }`}
    style={{ minWidth: '280px', pointerEvents: 'auto' }}
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
      type === 'success' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
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
  </div>
);

const TopBar = ({ showSearch, search, setSearch, user, onProfileClick, onBackHome }) => (
  <div className="h-[68px] border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between no-print relative z-50">
    <div className="flex items-center gap-4 flex-1">
      <button
        onClick={onBackHome}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:border-[#14453d]/20 hover:bg-[#f2f7f5] hover:text-[#14453d] active:scale-95 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {showSearch && (
        <div className="relative w-full max-w-md ml-2">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search diagnostic reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14453d]/5 focus:border-[#14453d]/20 transition-all"
          />
        </div>
      )}
    </div>

    <div className="flex items-center gap-3">
      <div className="h-8 w-px bg-gray-100 mx-2" />
      <button 
        onClick={onProfileClick}
        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group"
      >
        <div className="text-right flex flex-col justify-center">
           <span className="text-xs font-bold text-gray-700 leading-none">{user.name}</span>
           <span className="text-[9px] text-gray-400 font-medium mt-0.5 capitalize">{user.role}</span>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform" style={{ background: PRIMARY }}>
          {user.avatar}
        </div>
      </button>
    </div>
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
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUpdateClick();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-white transition-all">
            <Settings size={16} />
          </div>
          <span className="text-sm font-semibold">Update Profile</span>
          <ChevronRight size={14} className="ml-auto text-gray-300" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMyReportsClick();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#e8f5f0] text-[#14453d] flex items-center justify-center group-hover:bg-white transition-all">
            <FolderOpen size={16} />
          </div>
          <span className="text-sm font-semibold">My Reports</span>
          <ChevronRight size={14} className="ml-auto text-gray-300" />
        </button>

        <div className="h-px bg-gray-50 my-2 mx-2" />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-500 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-white transition-all">
            <LogOut size={16} />
          </div>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
};

const ProfileUpdateModal = ({ user, onClose, onUpdated, isSolo = false }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [dob, setDob] = useState(user.dob || '');
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
      await upsertServerProfile(session.access_token, {
        full_name: name,
        phone,
        dob,
        avatar_url
      });

      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${isSolo ? 'bg-white/95' : 'bg-black/40 backdrop-blur-[2px]'}`}>
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



/** Modal to view basic report details before AI analysis */
const ReportModal = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100"
        >
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-[#e8f5f0] rounded-2xl flex items-center justify-center text-[#14453d]">
                <FileText size={28} />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{report.testName}</h2>
              <div className="flex items-center gap-3">
                <CategoryChip label={report.category} />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{report.date}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                <Badge status={report.status} />
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Uploaded By</p>
                <p className="text-sm font-bold text-gray-700">{report.uploaded_by || 'Hospital Lab'}</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-900 mb-1">AI Intelligence Available</h4>
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                    This report can be processed by our clinical engine to provide biomarker insights and simplified summaries.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  onClose();
                  if (typeof report.onAiScan === 'function') report.onAiScan(report);
                }}
                style={{ background: PRIMARY }}
                className="flex-1 py-4 rounded-2xl text-white font-bold shadow-xl shadow-[#14453d]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Analyze Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/** Master layout shell used by all 3 portals */
const Shell = ({ navItems, showSearch = false, renderContent }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [user,      setUserState] = useState(null);
  const [search,    setSearch]    = useState('');
  const [showAiEngine, setShowAiEngine] = useState(false);
  const [aiAnalysis,   setAiAnalysis]   = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  
  const [isProfileModalSolo, setIsProfileModalSolo] = useState(false);
  const [shouldReturnHomeAfterProfileClose, setShouldReturnHomeAfterProfileClose] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [processingReport, setProcessingReport] = useState(null);
  const [processingSubStep, setProcessingSubStep] = useState(0);
  const previousActiveIdxRef = useRef(0);
  
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
  const navigate = useNavigate();
  const location = useLocation();

  const processingSteps = [
    "Securely reading report file...",
    "Extracting clinical biomarkers...",
    "AI synthesis & risk assessment..."
  ];

  const onLogout = async () => {
    addToast('Logging out safely...', 'info');
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate('/');
    }, 800);
  };

  const fetchFullProfile = async () => {
    setIsUserLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/');
        return;
      }
      
      const profile = await getProfile(authUser.id);
      
      setUserState({
        id: authUser.id,
        name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        email: authUser.email,
        phone: profile?.phone || '',
        dob: profile?.dob || '',
        avatar_url: profile?.avatar_url || null,
        role: authUser.user_metadata?.role || 'patient',
        avatar: (profile?.full_name || authUser.email).charAt(0).toUpperCase()
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let needsCleanup = false;

    if (params.get('login') === 'success') {
      addToast('Welcome back to your portal!', 'success');
      params.delete('login');
      needsCleanup = true;
    }

    const isProfileUpdateRequested = params.get('profile') === 'update';
    if (isProfileUpdateRequested) {
      setShouldReturnHomeAfterProfileClose(params.get('returnTo') === 'home');
      setActiveIdx((prev) => {
        previousActiveIdxRef.current = prev;
        return -1;
      });
      setIsProfileModalSolo(true);
      setIsUpdateModalOpen(true);
      params.delete('profile');
      params.delete('returnTo');
      params.delete('tab');
      needsCleanup = true;
    }

    const tab = params.get('tab');
    if (!isProfileUpdateRequested && tab === 'reports') {
      setActiveIdx(0);
      params.delete('tab');
      needsCleanup = true;
    }

    if (needsCleanup) {
      const nextQuery = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextQuery ? `?${nextQuery}` : '',
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f6]">
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 text-sm font-semibold text-gray-600 shadow-sm">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f6]">
        <div className="bg-white border border-rose-100 rounded-2xl px-6 py-5 text-sm font-semibold text-rose-600 shadow-sm">
          Unable to load profile. Please login again.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell-outer min-h-screen" style={{ background: '#f5f7f6' }}>
      <style>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .dashboard-shell-outer {
            min-height: 0 !important;
            display: block !important;
            padding: 0 !important;
            background: white !important;
            position: static !important;
          }
          .dashboard-shell {
            display: block !important;
            max-width: none !important;
            height: auto !important;
            overflow: visible !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            position: static !important;
          }
          .dashboard-main {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            position: static !important;
          }
          .dashboard-scroll {
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
            background: white !important;
            position: static !important;
            display: block !important;
          }
          .no-print, [aria-hidden="true"], .fixed.inset-0.bg-black\\/40 {
            display: none !important;
          }
          /* Force all animated/hidden elements to be visible */
          * {
            opacity: 1 !important;
            visibility: visible !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="dashboard-shell relative z-10 flex min-h-screen w-full overflow-hidden bg-white print:overflow-visible print:h-auto"
        style={{
          boxShadow: 'none',
        }}
      >
        {!isProfileModalSolo && (
          <Sidebar navItems={navItems} activeIdx={activeIdx}
                   setActiveIdx={(i) => { setActiveIdx(i); setSearch(''); setShowAiEngine(false); setAiAnalysis(null); }}
                   user={user}
                   onLogout={onLogout} />
        )}

        <div className="dashboard-main flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fcfdfc] print:h-auto print:overflow-visible">
          {!isProfileModalSolo && (
            <TopBar 
              showSearch={showSearch} 
              search={search} 
              setSearch={setSearch} 
              user={user}
              onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
              onBackHome={() => navigate('/')}
            />
          )}

          <AnimatePresence>
            {isProfileOpen && (
              <>
                {/* Invisible overlay to block clicks on content behind dropdown */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99]"
                  onClick={() => setIsProfileOpen(false)}
                />
                <ProfileDropdown 
                  user={user} 
                  onClose={() => setIsProfileOpen(false)}
                  onUpdateClick={() => {
                    setIsProfileOpen(false);
                    setIsProfileModalSolo(false);
                    setIsUpdateModalOpen(true);
                  }}
                  onMyReportsClick={() => {
                    setIsProfileOpen(false);
                    setActiveIdx(0);
                    navigate('/patient?tab=reports');
                  }}
                  onLogout={onLogout}
                />
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isUpdateModalOpen && (
              <ProfileUpdateModal 
                user={user} 
                isSolo={isProfileModalSolo}
                onClose={() => {
                  setIsUpdateModalOpen(false);
                  if (isProfileModalSolo) {
                    setIsProfileModalSolo(false);
                    if (shouldReturnHomeAfterProfileClose) {
                      setShouldReturnHomeAfterProfileClose(false);
                      navigate('/');
                      return;
                    }
                    setActiveIdx(previousActiveIdxRef.current >= 0 ? previousActiveIdxRef.current : 0);
                  }
                }} 
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
          <div className="dashboard-scroll flex-1 overflow-auto p-6 print:overflow-visible print:h-auto" style={{ background: '#f8faf9' }}>
            {isProfileModalSolo ? null : showAiEngine ? (
              <AIEngine 
                patientId={user.id}
                onAnalysisComplete={async (data) => {
                  const normalized = normalizeAnalysis(data);
                  setAiAnalysis(normalized);
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
            ) : processingReport ? (
              <ProcessingScreen steps={processingSteps} subStep={processingSubStep} />
            ) : aiAnalysis ? (
              <MedicalReportView 
                data={aiAnalysis} 
                onBack={() => setAiAnalysis(null)} 
              />
            ) : (
              renderContent(activeIdx, user, search, { setProcessingReport, setProcessingSubStep, setAiAnalysis })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ① PATIENT PORTAL — My Reports + Timeline
═══════════════════════════════════════════════════════════════════════════ */

/** Animated report card */
const ReportCard = ({ report, onView, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4
               hover:border-[#14453d]/25 hover:shadow-sm transition-all group"
  >
    <div className="w-10 h-10 bg-[#e8f5f0] rounded-xl flex items-center justify-center shrink-0">
      <FileText size={18} className="text-[#14453d]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-bold text-gray-800 truncate">{report.testName}</div>
      <div className="flex items-center gap-2 mt-0.5">
        <CategoryChip label={report.category} />
        <span className="text-[10px] text-gray-400">{report.date}</span>
      </div>
    </div>
    <Badge status={report.status} />
    <TealBtn
      size="sm"
      onClick={() => {
        if (typeof report.onAiScan === 'function') {
          report.onAiScan(report);
        }
      }}
      disabled={(!report?.raw?.pdf_url && report.status !== 'Ready') || report.aiLoading}
      className="relative overflow-hidden group/ai"
      style={{ 
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
        boxShadow: '0 4px 12px rgba(20,184,166,0.25)'
      }}
    >
      <motion.div
        animate={{ 
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.05, 1] 
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 bg-white/10"
      />
      <div className="relative flex items-center gap-1.5 px-1">
        <Sparkles size={12} className={report.aiLoading ? 'animate-spin' : 'animate-pulse'} />
        <span className="font-black">{report.aiLoading ? 'Scanning...' : 'AI'}</span>
      </div>
    </TealBtn>
    <TealBtn
      size="sm"
      onClick={() => {
        if (report.results && Object.keys(report.results).length > 0) {
          setAiAnalysis(report.results);
          return;
        }
        if (report?.raw?.pdf_url) {
          window.open(report.raw.pdf_url, '_blank', 'noopener,noreferrer');
          return;
        }
        onView(report);
      }}
      disabled={report.status !== 'Ready'}
    >
      <Download size={12} /> View
    </TealBtn>
  </motion.div>
);

const ProcessingScreen = ({ steps, subStep }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex-1 flex flex-col items-center justify-center p-8 min-h-[500px] bg-white/40 backdrop-blur-sm rounded-[3rem]"
  >
    {/* Premium Intelligence Loader */}
    <div className="relative mb-16">
      <motion.div 
        animate={{ 
          rotate: 360,
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          rotate: { repeat: Infinity, duration: 8, ease: "linear" },
          scale: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }}
        className="w-40 h-40 rounded-full border-[1px] border-emerald-100/30 flex items-center justify-center relative"
      >
        {/* Orbital dots */}
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translate(80px) rotate(-${deg}deg)`
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
          />
        ))}
        
        <div className="w-32 h-32 rounded-full border-[1px] border-emerald-50 flex items-center justify-center bg-white shadow-[0_0_50px_rgba(16,185,129,0.05)]">
          <div className="relative">
            <Loader2 size={48} className="text-[#14453d] animate-spin" strokeWidth={1.5} />
            <motion.div 
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sparkles size={24} className="text-emerald-500/30" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Pulsating background glows */}
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }} 
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
        className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl -z-10" 
      />
    </div>

    <motion.h2 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-3xl font-black text-gray-800 mb-12 tracking-tight text-center"
    >
      Intelligence Pipeline <span className="text-emerald-600">Active</span>
    </motion.h2>

    <div className="w-full max-w-sm space-y-6 mx-auto">
      {steps.map((text, i) => {
        const isActive = subStep === i;
        const isCompleted = subStep > i;
        const isPending = subStep < i;

        return (
          <motion.div 
            key={i} 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-5 relative group"
          >
            {/* Connection Line */}
            {i < 2 && (
              <div className="absolute left-4 top-8 w-[2px] h-6 bg-gray-100 -z-10 overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: isCompleted ? "100%" : "0%" }}
                  className="w-full bg-emerald-500"
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}

            {/* Step Icon/Number */}
            <motion.div 
              animate={{ 
                scale: isActive ? 1.1 : 1,
                backgroundColor: isCompleted ? '#10b981' : isActive ? '#14453d' : '#f3f4f6',
                color: isCompleted || isActive ? '#ffffff' : '#9ca3af'
              }}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${isActive ? 'shadow-emerald-200 shadow-lg' : ''}`}
            >
              {isCompleted ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle size={18} /></motion.div>
              ) : (
                <span className="text-xs font-black">{i + 1}</span>
              )}
            </motion.div>

            {/* Step Text */}
            <div className="flex flex-col">
              <span className={`text-[15px] font-bold transition-all duration-500 ${isActive ? 'text-gray-900 translate-x-1' : isCompleted ? 'text-emerald-600' : 'text-gray-300'}`}>
                {text}
              </span>
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] uppercase tracking-widest text-emerald-500 font-black mt-0.5"
                >
                  Processing...
                </motion.span>
              )}
            </div>

            {/* Scanning Shine Effect on Active Step */}
            {isActive && (
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent -z-10 rounded-2xl"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            )}
          </motion.div>
        );
      })}
    </div>

    {/* Bottom Insight Hint */}
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ delay: 1 }}
      className="mt-16 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 text-center"
    >
      Analyzing patterns with Labintel Core v4
    </motion.p>
  </motion.div>
);

/** Patient: My Reports tab */
const PatientReports = ({ user, setProcessingReport, setProcessingSubStep, setAiAnalysis }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiLoadingId, setAiLoadingId] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeReport, setActiveReport] = useState(null);

  const toDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read report file for AI scan.'));
    reader.readAsDataURL(blob);
  });

  const handleAiScan = async (report) => {
    // If we already have results, just show them!
    if (report.results && Object.keys(report.results).length > 0) {
      setAiAnalysis(report.results);
      return;
    }

    if (!report?.raw?.pdf_url) {
      setError('No report file link found for AI scan.');
      return;
    }

    setError('');
    setAiLoadingId(report.id);
    setProcessingReport(report);
    setProcessingSubStep(0);
    
    try {
      const fileResponse = await fetch(report.raw.pdf_url, { cache: 'no-store' });
      if (!fileResponse.ok) {
        throw new Error(`Unable to open report file (status ${fileResponse.status}).`);
      }
      
      setProcessingSubStep(1);
      const fileBlob = await fileResponse.blob();
      const dataUrl = await toDataUrl(fileBlob);
      const mimeType = fileBlob.type || 'application/pdf';

      const response = await apiClient.post('/analyze-report', {
        image: dataUrl,
        mimeType,
        patientId: user.id,
        analysisSpeed: chooseAnalysisSpeed({
          mimeType,
          fileSizeBytes: fileBlob.size,
          fileName: report?.raw?.pdf_url || '',
        }),
      });

      setProcessingSubStep(2);
      await new Promise(r => setTimeout(r, 800));
      
      const viewData = normalizeAnalysis(response?.data || {});
      setAiAnalysis(viewData);
    } catch (err) {
      if (isAiCapacityError(err)) {
        const retryAfterSec = Number(err?.response?.data?.retryAfterSec || 0);
        const fallback = normalizeAnalysis(buildAiCapacityFallbackPayload({ retryAfterSec }));
        setAiAnalysis(fallback);
        return;
      }

      const msg = err?.response?.data?.error || err.message || 'AI analysis failed.';
      setError(msg);
    } finally {
      setAiLoadingId('');
      setProcessingReport(null);
      setProcessingSubStep(0);
    }
  };

  useEffect(() => {
    let retryTimer = null;

    async function fetchReports(isRetry = false) {
      try {
        if (!isRetry) setLoading(true);
        setError('');
        const data = await getSupabaseReports(user.id);
        setReports(data || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        setError(err?.message || 'Unable to load reports right now.');
        if (!isRetry) {
          retryTimer = setTimeout(() => fetchReports(true), 1200);
        }
      } finally {
        if (!isRetry) setLoading(false);
      }
    }
    fetchReports();
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [user.id]);

  const tabs = ['All', 'Ready', 'Pending', 'Processing'];
  const visible = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  const stats = {
    total:      reports?.length || 0,
    ready:      reports?.filter(r => r.status === 'Ready').length || 0,
    pending:    reports?.filter(r => r.status === 'Pending').length || 0,
    processing: reports?.filter(r => r.status === 'Processing').length || 0,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-[#14453d] animate-spin mb-4 opacity-20" />
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Syncing Reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Sync Failed</h3>
        <p className="text-sm text-gray-500 max-w-xs mb-6">{error}</p>
        <TealBtn onClick={() => window.location.reload()}>Retry Connection</TealBtn>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ReportModal report={activeReport} onClose={() => setActiveReport(null)} />

      {/* Greeting */}
      <div className="mb-5">
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
          { label: 'Total',      value: stats.total,      color: 'text-gray-700',    bg: 'bg-white' },
          { label: 'Ready',      value: stats.ready,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending',    value: stats.pending,    color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Processing', value: stats.processing, color: 'text-teal-600',    bg: 'bg-teal-50' },
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
      <div className="space-y-2.5">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-xs font-semibold">
            {error}
          </div>
        )}
        {visible.length > 0
          ? visible.map((r, i) => (
              <ReportCard
                key={r.id}
                report={{
                  ...r,
                  onAiScan: handleAiScan,
                  aiLoading: aiLoadingId === r.id,
                }}
                onView={setActiveReport}
                index={i}
              />
            ))
          : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white
                            rounded-2xl border border-gray-200">
              <FileText size={32} className="text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">No reports in this category</p>
            </div>
          )}
      </div>
    </div>
  );
};

/** Patient: Timeline tab */
const PatientTimeline = ({ user }) => {
  const [activeReport, setActiveReport] = useState(null);
  const reports = getReports().filter(r => r.patientId === user.id)
                               .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <ReportModal report={activeReport} onClose={() => setActiveReport(null)} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Report Timeline</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your complete diagnostic history.</p>
      </div>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gray-200" />
        <div className="space-y-1">
          {reports.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex gap-5 relative">
              {/* Dot */}
              <div className={`w-9 h-9 rounded-full border-2 shrink-0 flex items-center justify-center z-10
                              ${r.status === 'Ready' ? 'bg-[#14453d] border-[#14453d]' :
                                r.status === 'Pending' ? 'bg-white border-amber-400' :
                                                          'bg-white border-teal-400'}`}>
                {r.status === 'Ready'
                  ? <CheckCircle size={14} className="text-white" />
                  : r.status === 'Pending'
                    ? <Clock size={14} className="text-amber-500" />
                    : <Activity size={14} className="text-teal-500" />
                }
              </div>
              {/* Card */}
              <div className="flex-1 mb-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-4
                                flex items-center gap-4 hover:border-[#14453d]/25 transition-all">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800">{r.testName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryChip label={r.category} />
                      <span className="text-xs text-gray-400">{r.date}</span>
                    </div>
                  </div>
                  <Badge status={r.status} />
                  <TealBtn size="sm" onClick={() => setActiveReport(r)}
                           disabled={r.status !== 'Ready'}>
                    <Download size={12} /> View
                  </TealBtn>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export const PatientPortal = () => (
  <Shell
    navItems={[
      { icon: FileText,   label: 'My Reports' },
      { icon: Search,     label: 'Search' },
      { icon: Sparkles,   label: 'OCR Scan' },
      { icon: Activity,   label: 'Timeline' },
      { icon: TrendingUp, label: 'Trends' },
      { icon: MessageSquare, label: 'Assistant' },
    ]}
    renderContent={(tabIdx, user, search, processing) => {
      const { setProcessingReport, setProcessingSubStep, setAiAnalysis } = processing || {};
      if (tabIdx === 0) return <PatientReports user={user} setProcessingReport={setProcessingReport} setProcessingSubStep={setProcessingSubStep} setAiAnalysis={setAiAnalysis} />;
      if (tabIdx === 1) return <div className="p-10 text-center font-bold text-gray-400">Clinical Search coming soon...</div>;
      if (tabIdx === 2) return <OCRScanningWorkspace user={user} />;
      if (tabIdx === 3) return <PatientTimeline user={user} />;
      if (tabIdx === 4) return <TrendsView user={user} />;
      if (tabIdx === 5) return <div className="p-10 text-center font-bold text-gray-400">AI Assistant coming soon...</div>;
      return <PatientReports user={user} setProcessingReport={setProcessingReport} setProcessingSubStep={setProcessingSubStep} setAiAnalysis={setAiAnalysis} />;
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
            onDragOver={e => { e.preventDefault(); setIsDragging(true);  }}
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
    total:      reports.length,
    ready:      reports.filter(r => r.status === 'Ready').length,
    pending:    reports.filter(r => r.status === 'Pending').length,
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
            { label: 'Total',      value: stats.total,      bg: 'bg-white',       color: 'text-gray-700'  },
            { label: 'Ready',      value: stats.ready,      bg: 'bg-emerald-50',  color: 'text-emerald-700'},
            { label: 'Pending',    value: stats.pending,    bg: 'bg-amber-50',    color: 'text-amber-700'  },
            { label: 'Processing', value: stats.processing, bg: 'bg-teal-50',     color: 'text-teal-700'   },
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
      { icon: LayoutDashboard, label: 'Stats' },
      { icon: FileUp,          label: 'Upload' },
      { icon: Users,           label: 'Patients' },
      { icon: Settings,        label: 'Settings' },
      { icon: Sparkles,        label: 'AI Scan' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search, processing) => {
      const { setProcessingReport, setProcessingSubStep } = processing || {};
      if (tabIdx === 0) return <div className="p-10 text-center font-bold text-gray-400">Lab Statistics coming soon...</div>;
      if (tabIdx === 1) return <LabUpload user={user} />;
      if (tabIdx === 2) return <div className="p-10 text-center font-bold text-gray-400">Patient Directory coming soon...</div>;
      if (tabIdx === 3) return <div className="p-10 text-center font-bold text-gray-400">Lab Configuration coming soon...</div>;
      if (tabIdx === 4) return <OCRScanningWorkspace user={user} />;
      return <LabAllReports user={user} search={search} />;
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
  const staff    = USERS.filter(u => u.role === 'staff');

  const stats = [
    { label: 'Total Users',     value: USERS.length,                                          color: 'text-[#14453d]',   bg: 'bg-[#e8f5f0]',    border: 'border-teal-200' },
    { label: 'Patients',        value: patients.length,                                       color: 'text-emerald-700', bg: 'bg-emerald-50',   border: 'border-emerald-200' },
    { label: 'Lab Staff',       value: staff.length,                                          color: 'text-sky-700',     bg: 'bg-sky-50',       border: 'border-sky-200'    },
    { label: 'Total Reports',   value: reports.length,                                        color: 'text-gray-700',    bg: 'bg-white',        border: 'border-gray-200'  },
    { label: 'Ready',           value: reports.filter(r=>r.status==='Ready').length,           color: 'text-emerald-700', bg: 'bg-emerald-50',   border: 'border-emerald-200'},
    { label: 'Pending/Process', value: reports.filter(r=>r.status!=='Ready').length,           color: 'text-amber-700',   bg: 'bg-amber-50',     border: 'border-amber-200'  },
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
    staff:   'bg-sky-100    text-sky-700',
    admin:   'bg-rose-100   text-rose-700',
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
      { icon: TrendingUp,  label: 'Overview' },
      { icon: Users,       label: 'Users'    },
      { icon: FileText,    label: 'Reports'  },
      { icon: Sparkles,    label: 'OCR Scanning' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search, processing) => {
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

  const filtered = reports.filter(r =>
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.testName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ReportModal report={activeReport} onClose={() => setActiveReport(null)} />
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
                  <TealBtn size="sm" onClick={() => setActiveReport(r)} disabled={r.status !== 'Ready'}>
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
      { icon: Activity,    label: 'Patient Reports' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search) => <DoctorReports search={search} />}
  />
);
