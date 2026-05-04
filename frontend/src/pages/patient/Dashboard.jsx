import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../../services/patientService';
import { PatientLayout } from '../../components/patient/PatientLayout';
import { Card, Badge, Skeleton, EmptyState, FlagBadge } from '../../components/common';
import { formatDate, timeAgo } from '../../utils/formatDate';
import { isCritical } from '../../utils/flagColor';
import { AlertTriangle, Search, ChevronDown, ChevronRight, FileText, X, Brain, Check, Clock, Download } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';
import { reportService } from '../../services/reportService';
import { useUIStore } from '../../store/uiStore';


function ReportTracking({ report }) {
  const steps = [
    { label: 'Booking', date: report.created_at, completed: true },
    { label: 'Sample Collection', date: report.collected_at, completed: !!report.collected_at },
    { label: 'Test Process Done', date: (report.status === 'in_review' || report.status === 'released') ? (report.reported_at || report.created_at) : null, completed: report.status === 'in_review' || report.status === 'released' },
    { label: 'Released', date: report.status === 'released' ? report.reported_at : null, completed: report.status === 'released' },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracking Progress</h4>
        <Badge variant={report.status === 'released' ? 'success' : 'warning'}>
          {report.status === 'released' ? 'Released' : report.status === 'in_review' ? 'In Review' : 'Processing'}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4 relative">
            {i < steps.length - 1 && (
              <div className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${steps[i + 1].completed ? 'bg-emerald-500' : 'bg-slate-100'}`} />
            )}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] ${step.completed ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
              {step.completed ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className={`text-xs font-bold ${step.completed ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</p>
                {step.date && <p className="text-[9px] font-medium text-slate-400">{formatDateTime(step.date)}</p>}
              </div>
              {!step.completed && i === steps.findIndex(s => !s.completed) && (
                <p className="text-[10px] text-teal-600 font-medium mt-0.5 animate-pulse">In progress…</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportCard({ report }) {
  const { addToast } = useUIStore();
  const lab = report.labs || {};
  const panel = report.test_panels || {};
  const patientCode = report.lab_patient?.lab_patient_code;
  const accentColor = lab.primary_color || '#0d9488';
  const isReleased = report.status === 'released';

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await reportService.getDownloadUrl(report.id);
      window.open(result.url, '_blank');
    } catch {
      addToast('Could not generate download link.', 'error');
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-teal-200 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
          style={{ background: accentColor }}>
          {lab.name?.[0] || '🔬'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{panel.name || 'Lab Report'}</p>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
            {lab.name} {patientCode ? `· ID: ${patientCode}` : ''}
          </p>
        </div>
        {isReleased && (
          <Link to={`/reports/${report.id}`} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
            <ChevronRight size={18} />
          </Link>
        )}
      </div>

      {!isReleased ? (
        <ReportTracking report={report} />
      ) : (
        <div className="mt-4 flex gap-2">
          <Link to={`/reports/${report.id}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-sm shadow-teal-100 transition-all">
            <Brain size={14} /> AI Report
          </Link>
          <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all">
            <FileText size={14} /> Original
          </button>
        </div>
      )}
    </div>
  );
}

export default function PatientDashboard() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['patient-reports'],
    queryFn: patientService.portal.getMyReports,
    staleTime: 1000 * 60 * 2,
  });

  const reports = data?.data || [];

  // Check for critical values in last 30 days
  const hasCritical = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    return reports.some((r) => {
      const hasFlag = r.test_values?.some((v) => isCritical(v.flag));
      return hasFlag && new Date(r.reported_at) > cutoff;
    });
  }, [reports]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter((r) =>
      r.test_panels?.name?.toLowerCase().includes(q) ||
      r.labs?.name?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  // Group by lab
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((r) => {
      const labId = r.labs?.name || 'Unknown Lab';
      if (!g[labId]) g[labId] = { lab: r.labs, reports: [] };
      g[labId].reports.push(r);
    });
    return Object.entries(g);
  }, [filtered]);

  const toggleLab = (name) => setCollapsed((c) => ({ ...c, [name]: !c[name] }));

  return (
    <PatientLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Health Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">All your lab reports from every visit</p>
        </div>

        {/* Critical alert banner */}
        {hasCritical && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
            <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">One or more recent results need attention</p>
              <p className="text-xs text-red-600 mt-0.5">Critical values detected in reports from the last 30 days. Please consult your doctor.</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by panel or lab name…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No reports yet"
            description="Visit a lab to get started. Your reports will appear here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="No matching reports" description="Try a different search term." />
        ) : (
          <div className="space-y-8">
            {/* In Progress Section */}
            {filtered.some(r => r.status !== 'released') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Clock size={16} className="text-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Tracking</h2>
                </div>
                <div className="space-y-3">
                  {filtered.filter(r => r.status !== 'released').map((r) => <ReportCard key={r.id} report={r} />)}
                </div>
              </div>
            )}

            {/* Released Section */}
            {filtered.some(r => r.status === 'released') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <FileText size={16} className="text-teal-600" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Released Reports</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {filtered.filter(r => r.status === 'released').map((r) => <ReportCard key={r.id} report={r} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
