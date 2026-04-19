import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { reportService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { KPICard, Card, StatusBadge, Skeleton, EmptyState, Button, Badge } from '../../components/common';
import { timeAgo, formatDate } from '../../utils/formatDate';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { useUIStore } from '../../store/uiStore';
import {
  Users, FileText, Clock, Bell, Plus, UserPlus, AlertTriangle,
  ChevronRight, TrendingUp, TrendingDown, Activity, ChevronDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#d97706', '#059669', '#9333ea'];

// ─── Manager / Admin Dashboard ──────────────────────────────────────────────
function ManagerDashboard() {
  const lp = useLabPath();
  const qc = useQueryClient();
  const { addToast } = useUIStore();
  const [releasingId, setReleasingId] = useState(null);

  // Fetch manager KPIs
  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['manager-dashboard'],
    queryFn: analyticsService.getManagerDashboard,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  // Fetch volume data (bar chart — last 14 days)
  const { data: vol, isLoading: volLoad } = useQuery({
    queryKey: ['analytics-volume'],
    queryFn: analyticsService.getVolume,
    staleTime: 60000,
  });

  // Fetch panel distribution (donut chart)
  const { data: panels, isLoading: panLoad } = useQuery({
    queryKey: ['analytics-panels'],
    queryFn: analyticsService.getPanels,
    staleTime: 60000,
  });

  // Fetch reports awaiting release
  const { data: awaitingData, isLoading: awaitLoad } = useQuery({
    queryKey: ['awaiting-release'],
    queryFn: analyticsService.getAwaitingRelease,
    staleTime: 1000 * 30,
  });

  const kpiData = kpi?.data;
  const volData = (vol?.data || []).slice(-14);
  const panelData = panels?.data || [];
  const awaitingReports = awaitingData?.data || [];

  // Release report mutation
  const releaseMutation = useMutation({
    mutationFn: (id) => reportService.updateStatus(id, 'released'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['awaiting-release'] });
      qc.invalidateQueries({ queryKey: ['manager-dashboard'] });
      qc.invalidateQueries({ queryKey: ['analytics-volume'] });
      addToast('Report released successfully!', 'success');
      setReleasingId(null);
    },
    onError: (err) => {
      addToast(err?.response?.data?.error || 'Failed to release report.', 'error');
      setReleasingId(null);
    },
  });

  const handleRelease = (id) => {
    setReleasingId(id);
    releaseMutation.mutate(id);
  };

  // Flag badge styles
  const flagStyles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high:     'bg-orange-100 text-orange-700 border-orange-200',
    low:      'bg-amber-100 text-amber-700 border-amber-200',
    normal:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  // Submitted date formatting (relative)
  const formatSubmitted = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 3600 * 24));
    if (diffDays === 0) {
      return 'Today ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      {/* Analytics Summary Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 mb-6">
        <div className="flex px-4 items-center justify-between md:justify-center w-full md:w-auto">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Month Volume</p>
            <p className="text-xl font-bold text-slate-800">{kpiLoading ? <Skeleton className="h-6 w-16 mt-1" /> : (kpiData?.reports_this_month ?? '0')}</p>
          </div>
          {kpiData?.month_change_percent != null && (
            <div className={`text-xs ml-3 font-medium ${kpiData.month_change_percent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {kpiData.month_change_percent >= 0 ? '↑ ' : '↓ '}{Math.abs(kpiData.month_change_percent)}%
            </div>
          )}
        </div>
        <div className="flex px-4 items-center justify-between md:justify-center w-full md:w-auto">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Pending</p>
            <p className="text-xl font-bold text-slate-800">{kpiLoading ? <Skeleton className="h-6 w-16 mt-1" /> : (kpiData?.pending_release || '0')}</p>
          </div>
        </div>
        <div className="flex px-4 items-center justify-between md:justify-center w-full md:w-auto">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Turnaround</p>
            <p className="text-xl font-bold text-slate-800">{kpiLoading ? <Skeleton className="h-6 w-16 mt-1" /> : (kpiData?.avg_turnaround_hours ? `${kpiData.avg_turnaround_hours}h` : '—')}</p>
          </div>
        </div>
        <div className="flex px-4 items-center justify-between md:justify-center w-full md:w-auto">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Top Panel</p>
            <p className="text-xl font-bold text-slate-800">{panLoad ? <Skeleton className="h-6 w-16 mt-1" /> : (panelData[0]?.short_code || panelData[0]?.name || '—')}</p>
          </div>
        </div>
        <div className="flex px-4 items-center justify-between md:justify-center w-full md:w-auto">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Active Staff</p>
            <p className="text-xl font-bold text-emerald-600">8 <span className="text-xs text-slate-400 font-normal">checked in</span></p>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Volume bar chart */}
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Reports — last 14 days</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>Reports per day</span>
            </div>
          </div>
          {volLoad ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `Apr ${d.getDate()}`;
                  }}
                  interval={1}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(val) => [val, 'Reports']}
                  labelFormatter={(v) => {
                    const d = new Date(v);
                    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Panel donut */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4">Reports by test panel</h2>
          {panLoad ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={panelData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {panelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry) => {
                    const item = panelData.find(p => p.name === value);
                    const total = panelData.reduce((s, p) => s + p.count, 0);
                    const pct = total > 0 ? Math.round((item?.count || 0) / total * 100) : 0;
                    return <span className="text-xs text-slate-600">{item?.short_code || value} {pct}%</span>;
                  }}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Reports awaiting release */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Reports awaiting release</h2>
            <p className="text-xs text-slate-500 mt-0.5">Only you can release reports to patients</p>
          </div>
          <Link to={lp('reports?status=in_review')} className="text-xs font-medium text-teal-600 hover:underline flex items-center gap-1">
            View all in-review reports <ChevronRight size={12} />
          </Link>
        </div>

        {awaitLoad ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : awaitingReports.length === 0 ? (
          <EmptyState icon="✅" title="No reports awaiting release" description="All in-review reports have been released." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Test</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Flags</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">By</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {awaitingReports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={lp(`reports/${r.id}`)} className="hover:text-teal-600 transition-colors">
                        <p className="font-semibold text-slate-800">{r.patient?.full_name || '—'}</p>
                        <p className="text-[10px] text-slate-400">{r.patient?.phone || ''}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{r.test_panel?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                      {formatSubmitted(r.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${flagStyles[r.flag_level] || flagStyles.normal}`}>
                        {r.flag_summary}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell text-xs">
                      {r.created_by?.full_name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleRelease(r.id)}
                          isLoading={releasingId === r.id}
                          className="!py-1.5 !px-3 !text-xs bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                        >
                          Release
                        </Button>
                        <Link
                          to={lp(`reports/${r.id}`)}
                          className="inline-flex items-center px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <ChevronDown size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Receptionist / Technician Dashboard ─────────────────────────────────────
function StaffDashboard() {
  const { canDo } = usePermission();
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

  return (
    <div className="space-y-6">
      {/* Removed header/actions */}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Patients This Month" value={kpiData?.patients_this_month} icon={<Users size={20} />} color="teal" isLoading={kpiLoading} sub="New registrations" />
        <KPICard title="Reports Today" value={kpiData?.reports_today} icon={<FileText size={20} />} color="blue" isLoading={kpiLoading} sub="Created today" />
        <KPICard title="Pending Reports" value={kpiData?.pending_reports} icon={<Clock size={20} />} color="amber" isLoading={kpiLoading} sub="Draft + In review" />
        <KPICard title="Unread Alerts" value={kpiData?.unread_alerts} icon={<Bell size={20} />} color={(kpiData?.unread_alerts || 0) > 0 ? 'red' : 'teal'} isLoading={kpiLoading} sub="Health alerts" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Recent Reports */}
        <div>
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
      </div>
    </div>
  );
}

// ─── Main Dashboard — role-based rendering ──────────────────────────────────
export default function LabDashboard() {
  const { role } = usePermission();
  const isAdmin = role === 'manager';

  return (
    <LabLayout>
      {/* Dashboard Title removed as per layout rules */}

      {isAdmin ? <ManagerDashboard /> : <StaffDashboard />}
    </LabLayout>
  );
}
