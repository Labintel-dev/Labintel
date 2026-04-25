import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/analyticsService';
import { LabLayout } from '../../components/lab/LabLayout';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { cn } from '../../utils/cn';
import {
  FileText, Clock, AlertTriangle, FileWarning,
  Plus, Info, Eye, ArrowRight,
} from 'lucide-react';

// ── Format collected_at into human-friendly string ───────────────────────
function formatCollected(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Stat card component ──────────────────────────────────────────────────
function StatCard({ label, value, sub, color, isLoading }) {
  const colorMap = {
    blue:   'text-blue-700',
    amber:  'text-amber-600',
    slate:  'text-slate-700',
    red:    'text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      {isLoading ? (
        <div className="h-8 w-16 skeleton rounded mt-1" />
      ) : (
        <p className={cn('text-3xl font-bold', colorMap[color] || 'text-slate-800')}>
          {value ?? '—'}
        </p>
      )}
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

// ── Status dot component ─────────────────────────────────────────────────
function StatusDot({ status }) {
  const config = {
    draft:     { label: 'Draft',     dotColor: 'bg-slate-400', textColor: 'text-slate-600' },
    in_review: { label: 'In review', dotColor: 'bg-amber-500', textColor: 'text-amber-700' },
    released:  { label: 'Released',  dotColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
  };
  const c = config[status] || config.draft;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', c.textColor)}>
      <span className={cn('w-2 h-2 rounded-full', c.dotColor)} />
      {c.label}
    </span>
  );
}

// ── Flag label component ─────────────────────────────────────────────────
function FlagLabel({ flagSummary, flagType }) {
  const colorMap = {
    normal:   'text-emerald-600',
    low:      'text-amber-600',
    high:     'text-orange-600',
    critical: 'text-red-600',
  };

  return (
    <span className={cn('text-xs font-medium', colorMap[flagType] || 'text-slate-500')}>
      {flagSummary}
    </span>
  );
}

// ── Main Dashboard Component ─────────────────────────────────────────────
export default function LabDashboard() {
  const { canDo, role } = usePermission();
  const lp = useLabPath();

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: dashboardService.getStaffDashboard,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  const kpi = data?.data?.kpi;
  const reports = data?.data?.reports || [];

  return (
    <LabLayout>
      {/* ── Page title ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Reports today"
          value={kpi?.reports_today}
          sub="Entered by you"
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          label="In review"
          value={kpi?.in_review}
          sub="Awaiting admin"
          color="amber"
          isLoading={isLoading}
        />
        <StatCard
          label="Draft"
          value={kpi?.drafts}
          sub="Incomplete entries"
          color="slate"
          isLoading={isLoading}
        />
        <StatCard
          label="Critical flags"
          value={kpi?.critical_flags}
          sub="Needs attention"
          color="red"
          isLoading={isLoading}
        />
      </div>

      {/* ── Recent Reports Section ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">My recent reports</h2>
          {canDo('createReport') && (
            <Link to={lp('reports/new')}>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                <Plus size={15} />
                New report
              </button>
            </Link>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 skeleton rounded-lg" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} className="text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-600 mb-1">No reports yet</h3>
            <p className="text-sm text-slate-400">Create your first report to see it here.</p>
            {canDo('createReport') && (
              <Link to={lp('reports/new')} className="mt-4">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus size={15} />
                  New report
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Patient</div>
              <div className="col-span-2">Test panel</div>
              <div className="col-span-2">Collected</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Flags</div>
              <div className="col-span-1">Action</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-slate-50">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors"
                >
                  {/* Patient */}
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {r.patient?.full_name || 'Unknown'}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium">
                      {r.patient_code || '—'}
                    </p>
                  </div>

                  {/* Test panel */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-700 font-medium truncate">
                      {r.test_panel?.name || '—'}
                    </p>
                  </div>

                  {/* Collected */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">
                      {formatCollected(r.collected_at)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusDot status={r.status} />
                  </div>

                  {/* Flags */}
                  <div className="col-span-2">
                    <FlagLabel flagSummary={r.flag_summary} flagType={r.flag_type} />
                  </div>

                  {/* Action */}
                  <div className="col-span-1">
                    {r.status === 'draft' ? (
                      <Link
                        to={lp(`reports/${r.id}`)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Continue
                      </Link>
                    ) : (
                      <Link
                        to={lp(`reports/${r.id}`)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Info note */}
        {reports.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="flex items-center gap-2 text-[12px] text-slate-400">
              <Info size={14} className="shrink-0 text-slate-400" />
              You can create reports and mark them as 'In review'. Only an administrator can release reports to patients.
            </p>
          </div>
        )}
      </div>
    </LabLayout>
  );
}
