import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { reportService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { KPICard, Card, StatusBadge, Skeleton, EmptyState, Button } from '../../components/common';
import { timeAgo } from '../../utils/formatDate';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { Users, FileText, Clock, Bell, Plus, UserPlus, AlertTriangle, ChevronRight } from 'lucide-react';

export default function LabDashboard() {
  const { canDo, role } = usePermission();
  const lp = useLabPath();

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: analyticsService.getDashboard,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  const { data: recentData, isLoading: repLoading } = useQuery({
    queryKey: ['reports', { limit: 5 }],
    queryFn: () => reportService.getAll({ limit: 5 }),
    staleTime: 1000 * 60,
  });

  const kpiData = kpi?.data;
  const reports = recentData?.data || [];
  const hasAlerts = (kpiData?.unread_alerts || 0) > 0;

  return (
    <LabLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your lab's activity</p>
        </div>
        <div className="flex gap-2">
          {canDo('registerPatient') && (
            <Link to={lp('patients/new')}>
              <Button size="sm" variant="secondary"><UserPlus size={15} />New Patient</Button>
            </Link>
          )}
          {canDo('createReport') && (
            <Link to={lp('reports/new')}>
              <Button size="sm"><Plus size={15} />New Report</Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Patients This Month"
          value={kpiData?.patients_this_month}
          icon={<Users size={20} />}
          color="teal"
          isLoading={kpiLoading}
          sub="New registrations"
        />
        <KPICard
          title="Reports Today"
          value={kpiData?.reports_today}
          icon={<FileText size={20} />}
          color="blue"
          isLoading={kpiLoading}
          sub="Created today"
        />
        <KPICard
          title="Pending Reports"
          value={kpiData?.pending_reports}
          icon={<Clock size={20} />}
          color="amber"
          isLoading={kpiLoading}
          sub="Draft + In review"
        />
        <KPICard
          title="Unread Alerts"
          value={kpiData?.unread_alerts}
          icon={<Bell size={20} />}
          color={hasAlerts ? 'red' : 'teal'}
          isLoading={kpiLoading}
          sub="Health alerts"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Recent Reports</h2>
              <Link to={lp('reports')} className="text-xs font-medium text-teal-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            {repLoading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : reports.length === 0 ? (
              <EmptyState icon="📋" title="No reports yet" />
            ) : (
              <div className="divide-y divide-slate-50">
                {reports.map((r) => (
                  <Link key={r.id} to={lp(`reports/${r.id}`)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.patients?.full_name}</p>
                      <p className="text-xs text-slate-500">{r.test_panels?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-slate-400">{timeAgo(r.created_at)}</span>
                      <ChevronRight size={12} className="text-slate-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Alert preview (Admin only) */}
        {role === 'administrator' && (
          <div>
            <Card>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Health Alerts</h2>
                <Link to={lp('alerts')} className="text-xs font-medium text-teal-600 hover:underline">View all</Link>
              </div>
              {hasAlerts ? (
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <AlertTriangle size={16} className="text-red-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">{kpiData.unread_alerts} unread alert{kpiData.unread_alerts > 1 ? 's' : ''}</p>
                      <p className="text-xs text-red-600">Requires your attention</p>
                    </div>
                  </div>
                  <Link to={lp('alerts')}>
                    <Button variant="outline" size="sm" className="w-full">Review Alerts</Button>
                  </Link>
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-sm text-slate-500 text-center">✓ No unread alerts</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </LabLayout>
  );
}
