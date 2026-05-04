import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/analyticsService';
import { LabLayout } from '../../components/lab/LabLayout';
import { AttendanceWidget } from '../../components/lab/AttendanceWidget';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { cn } from '../../utils/cn';
import { FileText, Plus, Info } from 'lucide-react';

function formatCollected(dateStr) {
  if (!dateStr) return '-';
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

function StatCard({ label, value, sub, color, isLoading }) {
  const colorMap = {
    blue: 'text-blue-700',
    amber: 'text-amber-600',
    slate: 'text-slate-700',
    red: 'text-red-600',
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {isLoading ? (
        <div className="mt-1 h-8 w-16 rounded skeleton" />
      ) : (
        <p className={cn('text-3xl font-bold', colorMap[color] || 'text-slate-800')}>{value ?? '-'}</p>
      )}
      <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

function StatusDot({ status }) {
  const config = {
    draft: { label: 'Draft', dotColor: 'bg-slate-400', textColor: 'text-slate-600' },
    in_review: { label: 'In review', dotColor: 'bg-amber-500', textColor: 'text-amber-700' },
    released: { label: 'Released', dotColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
  };
  const c = config[status] || config.draft;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', c.textColor)}>
      <span className={cn('h-2 w-2 rounded-full', c.dotColor)} />
      {c.label}
    </span>
  );
}

function FlagLabel({ flagSummary, flagType }) {
  const colorMap = {
    normal: 'text-emerald-600',
    low: 'text-amber-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };

  return (
    <span className={cn('text-xs font-medium', colorMap[flagType] || 'text-slate-500')}>
      {flagSummary}
    </span>
  );
}

export default function LabDashboard() {
  const { canDo, role } = usePermission();
  const lp = useLabPath();

  const { data, isLoading } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: dashboardService.getStaffDashboard,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  const kpi = data?.data?.kpi;
  const reports = data?.data?.reports || [];

  const isTrackableRole = role === 'receptionist' || role === 'technician';

  return (
    <LabLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
      </div>

      {isTrackableRole && (
        <div className="mb-8">
          <AttendanceWidget />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reports today" value={kpi?.reports_today} sub="Entered by you" color="blue" isLoading={isLoading} />
        <StatCard label="In review" value={kpi?.in_review} sub="Awaiting admin" color="amber" isLoading={isLoading} />
        <StatCard label="Draft" value={kpi?.drafts} sub="Incomplete entries" color="slate" isLoading={isLoading} />
        <StatCard label="Critical flags" value={kpi?.critical_flags} sub="Needs attention" color="red" isLoading={isLoading} />
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="text-base font-semibold text-slate-800">My recent reports</h2>
          {canDo('createReport') && (
            <Link to={lp('reports/new')}>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
                <Plus size={15} />
                New report
              </button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-lg skeleton" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} className="mb-3 text-slate-300" />
            <h3 className="mb-1 text-base font-semibold text-slate-600">No reports yet</h3>
            <p className="text-sm text-slate-400">Create your first report to see it here.</p>
            {canDo('createReport') && (
              <Link to={lp('reports/new')} className="mt-4">
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  <Plus size={15} />
                  New report
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-4 border-b border-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <div className="col-span-3">Patient</div>
                <div className="col-span-2">Test panel</div>
                <div className="col-span-2">Collected</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Flags</div>
                <div className="col-span-1">Action</div>
              </div>

              <div className="divide-y divide-slate-50">
                {reports.map((r) => (
                  <div key={r.id} className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50">
                    <div className="col-span-3 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{r.patient?.full_name || 'Unknown'}</p>
                      <p className="text-[11px] font-medium text-blue-600">{r.patient_code || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="truncate text-sm font-medium text-slate-700">{r.test_panel?.name || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">{formatCollected(r.collected_at)}</p>
                    </div>
                    <div className="col-span-2">
                      <StatusDot status={r.status} />
                    </div>
                    <div className="col-span-2">
                      <FlagLabel flagSummary={r.flag_summary} flagType={r.flag_type} />
                    </div>
                    <div className="col-span-1">
                      <Link to={lp(`reports/${r.id}`)} className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800">
                        {r.status === 'draft' ? 'Continue' : 'View'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-50 md:hidden">
              {reports.map((r) => (
                <div key={r.id} className="space-y-2 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{r.patient?.full_name || 'Unknown'}</p>
                      <p className="text-[11px] font-medium text-blue-600">{r.patient_code || '-'}</p>
                    </div>
                    <StatusDot status={r.status} />
                  </div>
                  <p className="truncate text-sm text-slate-700">{r.test_panel?.name || '-'}</p>
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{formatCollected(r.collected_at)}</span>
                    <FlagLabel flagSummary={r.flag_summary} flagType={r.flag_type} />
                  </div>
                  <Link to={lp(`reports/${r.id}`)} className="inline-flex text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800">
                    {r.status === 'draft' ? 'Continue' : 'View'}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {reports.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
            <p className="flex items-start gap-2 text-[12px] text-slate-400">
              <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
              You can create reports and mark them as 'In review'. Only a manager or administrator can release reports to patients.
            </p>
          </div>
        )}
      </div>
    </LabLayout>
  );
}
