import React, { useState, useEffect, useRef } from 'react';
import { useNavigate }       from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Beaker, LogOut, Bell, User, FileText,
  Upload, Download, X,
  ShieldCheck, Users, TrendingUp, CheckCircle,
  Search, Activity, Clock, AlertCircle, Plus,
  Stethoscope,
} from 'lucide-react';
import {
  getUser, clearUser, getReports, saveReports, USERS,
  TEST_OPTIONS, CATEGORY_OPTIONS,
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
   REPORT DETAIL MODAL
═══════════════════════════════════════════════════════════════════════════ */
const ReportModal = ({ report, onClose }) => (
  <AnimatePresence>
    {report && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                  onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 24 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg
                               max-h-[90vh] overflow-hidden flex flex-col"
                    style={{ boxShadow: '0 32px 80px rgba(20,69,61,0.18)' }}>

          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-[#e8f5f0] rounded-2xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-[#14453d]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800 leading-tight">
                  {report.testName}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500">{report.patientName}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{report.date}</span>
                  <Badge status={report.status} />
                </div>
              </div>
            </div>
            <button onClick={onClose}
                    className="text-gray-400 hover:text-gray-700 transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto p-6">
            {report.results.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Parameter', 'Value', 'Reference Range', 'Flag'].map(h => (
                      <th key={h} className="text-left text-[10px] text-gray-400 font-bold
                                             uppercase tracking-wide pb-2.5 pr-4 last:pr-0 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-sm font-medium text-gray-700">{r.name}</td>
                      <td className="py-3 pr-4 text-sm font-bold text-gray-800">
                        {r.value} <span className="text-xs font-normal text-gray-400">{r.unit}</span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-400">{r.range}</td>
                      <td className="py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${r.flag === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                            r.flag === 'Low'    ? 'bg-amber-100   text-amber-700'   :
                                                  'bg-rose-100    text-rose-700'}`}>
                          {r.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock size={32} className="text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-500">Results not yet available</p>
                <p className="text-xs text-gray-400 mt-1">
                  This report is currently being processed.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              <span className="font-semibold text-gray-600">{report.category}</span>
              &nbsp;· Uploaded by {report.uploadedBy}
            </div>
            <TealBtn onClick={() => window.print()} size="sm">
              <Download size={12} /> Download PDF
            </TealBtn>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

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

const Sidebar = ({ navItems, activeIdx, setActiveIdx, user, onLogout }) => (
  <div className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col">
    <Logo />
    <nav className="flex-1 p-3 pt-4 space-y-0.5">
      {navItems.map((item, i) => (
        <NavItem key={item.label} icon={item.icon} label={item.label}
                 active={activeIdx === i} onClick={() => setActiveIdx(i)} />
      ))}
    </nav>
    {/* User info at bottom of sidebar */}
    <div className="p-3 border-t border-gray-100 space-y-1">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="w-7 h-7 rounded-full text-white text-xs font-bold
                        flex items-center justify-center shrink-0"
             style={{ background: PRIMARY }}>
          {user?.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-gray-700 truncate">{user?.name}</div>
          <div className="text-[10px] text-gray-400 capitalize">{user?.role}</div>
        </div>
      </div>
      <button onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left
                         text-sm font-semibold text-gray-400 hover:bg-rose-50
                         hover:text-rose-500 transition-all">
        <LogOut size={15} /> Logout
      </button>
    </div>
  </div>
);

const TopBar = ({ showSearch, search, setSearch }) => (
  <div className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 shrink-0">
    {showSearch
      ? <SearchBar value={search} onChange={setSearch} placeholder="Search reports, patients…" />
      : <span />
    }
    <div className="ml-auto flex items-center gap-2">
      <button className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-all">
        <Bell size={17} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
      </button>
    </div>
  </div>
);

/** Master layout shell used by all 3 portals */
const Shell = ({ navItems, showSearch = false, renderContent }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [user,      setUserState] = useState(null);
  const [search,    setSearch]    = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const u = getUser();
    if (!u) { navigate('/'); return; }
    setUserState(u);
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f5f7f6' }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full flex overflow-hidden rounded-2xl bg-white"
        style={{
          maxWidth: 1040,
          height: 620,
          boxShadow: '0 20px 64px rgba(20,69,61,0.08), 0 0 0 1px rgba(200,210,206,0.6)',
        }}
      >
        <Sidebar navItems={navItems} activeIdx={activeIdx}
                 setActiveIdx={(i) => { setActiveIdx(i); setSearch(''); }}
                 user={user}
                 onLogout={() => { clearUser(); navigate('/'); }} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar showSearch={showSearch} search={search} setSearch={setSearch} />
          <div className="flex-1 overflow-auto p-6" style={{ background: '#f8faf9' }}>
            {renderContent(activeIdx, user, search)}
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
    <TealBtn size="sm" onClick={() => onView(report)} disabled={report.status !== 'Ready'}>
      <Download size={12} /> View
    </TealBtn>
  </motion.div>
);

/** Patient: My Reports tab */
const PatientReports = ({ user }) => {
  const [reports]      = useState(() => getReports().filter(r => r.patientId === user.id));
  const [filter,       setFilter]       = useState('All');
  const [activeReport, setActiveReport] = useState(null);

  const tabs    = ['All', 'Ready', 'Pending', 'Processing'];
  const visible = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  const stats = {
    total:      reports.length,
    ready:      reports.filter(r => r.status === 'Ready').length,
    pending:    reports.filter(r => r.status === 'Pending').length,
    processing: reports.filter(r => r.status === 'Processing').length,
  };

  return (
    <>
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
        {visible.length > 0
          ? visible.map((r, i) => (
              <ReportCard key={r.id} report={r} onView={setActiveReport} index={i} />
            ))
          : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white
                            rounded-2xl border border-gray-200">
              <FileText size={32} className="text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">No reports in this category</p>
            </div>
          )}
      </div>
    </>
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
      { icon: FileText,  label: 'My Reports' },
      { icon: Activity,  label: 'Timeline'   },
    ]}
    renderContent={(tabIdx, user) =>
      tabIdx === 0 ? <PatientReports user={user} /> : <PatientTimeline user={user} />
    }
  />
);

/* ═══════════════════════════════════════════════════════════════════════════
   ② LAB PORTAL — Upload + All Reports
═══════════════════════════════════════════════════════════════════════════ */

/** Lab: Upload tab with drag-and-drop and report form */
const LabUpload = ({ user }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file,       setFile]       = useState(null);
  const [patientId,  setPatientId]  = useState('P001');
  const [testName,   setTestName]   = useState('');
  const [category,   setCategory]   = useState('Hematology');
  const [success,    setSuccess]    = useState(false);
  const fileRef = useRef(null);

  const patients = USERS.filter(u => u.role === 'patient');

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = () => {
    if (!testName) return;
    const patient   = USERS.find(u => u.id === patientId);
    const allReports = getReports();
    const newReport  = {
      id:          `R${Date.now()}`,
      patientId,
      patientName: patient.name,
      testName:    testName.trim(),
      date:        new Date().toISOString().split('T')[0],
      status:      'Processing',
      uploadedBy:  user.name,
      category,
      results:     [],
    };
    saveReports([...allReports, newReport]);
    setFile(null); setTestName(''); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
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
  const [reports, setReports] = useState(() => getReports());

  const updateStatus = (id, status) => {
    const updated = reports.map(r => r.id === id ? { ...r, status } : r);
    setReports(updated); saveReports(updated);
  };

  const filtered = reports.filter(r =>
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.testName.toLowerCase().includes(search.toLowerCase())
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
      { icon: Upload,   label: 'Upload'      },
      { icon: FileText, label: 'All Reports' },
    ]}
    showSearch
    renderContent={(tabIdx, user, search) =>
      tabIdx === 0
        ? <LabUpload user={user} />
        : <LabAllReports user={user} search={search} />
    }
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
    ]}
    showSearch
    renderContent={(tabIdx, user, search) => {
      if (tabIdx === 0) return <AdminOverview />;
      if (tabIdx === 1) return <AdminUsers search={search} />;
      return <AdminReports search={search} />;
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