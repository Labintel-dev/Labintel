import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../../services/patientService';
import { PatientLayout } from '../../components/patient/PatientLayout';
import { Card, Badge, Skeleton, EmptyState, FlagBadge } from '../../components/common';
import { formatDate, timeAgo } from '../../utils/formatDate';
import { isCritical } from '../../utils/flagColor';
import { AlertTriangle, Search, ChevronDown, ChevronRight, FileText, X } from 'lucide-react';

function ReportCard({ report }) {
  const lab = report.labs || {};
  const panel = report.test_panels || {};
  const accentColor = lab.primary_color || '#0d9488';
  return (
    <Link to={`/reports/${report.id}`} className="block">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all group">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: accentColor }} />
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0"
          style={{ background: accentColor }}>
          {lab.name?.[0] || '🔬'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{panel.name || 'Lab Report'}</p>
          <p className="text-xs text-slate-500">{formatDate(report.reported_at)}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Badge variant="success">Released</Badge>
          <ChevronRight size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
        </div>
      </div>
    </Link>
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
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No reports yet"
            description="Visit a lab to get started. Your reports will appear here."
          />
        ) : grouped.length === 0 ? (
          <EmptyState icon="🔍" title="No matching reports" description="Try a different search term." />
        ) : (
          <div className="space-y-4">
            {grouped.map(([labName, { lab, reports: labReports }]) => (
              <div key={labName}>
                <button
                  onClick={() => toggleLab(labName)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: lab?.primary_color || '#0d9488' }}>
                      {labName[0]}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{labName}</span>
                    <Badge variant="default">{labReports.length}</Badge>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${collapsed[labName] ? '-rotate-90' : ''}`} />
                </button>
                {!collapsed[labName] && (
                  <div className="space-y-2 pl-2 border-l-2 border-slate-100">
                    {labReports.map((r) => <ReportCard key={r.id} report={r} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
