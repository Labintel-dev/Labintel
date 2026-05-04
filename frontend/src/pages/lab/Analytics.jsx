import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analyticsService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, KPICard, Skeleton } from '../../components/common';
import { Users, FileText, Clock, Bell } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#d97706', '#059669', '#9333ea'];

export default function Analytics() {
  const { data: kpi,    isLoading: kpiLoad, error: kpiError }  = useQuery({ queryKey: ['analytics-dashboard'], queryFn: analyticsService.getDashboard, staleTime: 60000 });
  const { data: vol,    isLoading: volLoad, error: volError }  = useQuery({ queryKey: ['analytics-volume'],    queryFn: analyticsService.getVolume,    staleTime: 60000 });
  const { data: panels, isLoading: panLoad, error: panError }  = useQuery({ queryKey: ['analytics-panels'],    queryFn: analyticsService.getPanels,    staleTime: 60000 });
  const { data: turn,   isLoading: turnLoad, error: turnError } = useQuery({ queryKey: ['analytics-turnaround'],queryFn: analyticsService.getTurnaround, staleTime: 60000 });

  const kpiData    = kpi?.data;
  const volData    = Array.isArray(vol?.data) ? vol.data : [];
  const panelData  = Array.isArray(panels?.data) ? panels.data : [];
  const turnData   = turn?.data;
  const hasError = kpiError || volError || panError || turnError;
  const formatChartDate = (value) => {
    if (!value) return '';
    const text = String(value);
    return text.length >= 10 ? text.slice(5, 10) : text;
  };

  return (
    <LabLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">Lab performance over the last 30 days</p>
        </div>

        {hasError && (
          <Card className="p-4 border-red-100 bg-red-50 text-sm text-red-700">
            Analytics data could not be loaded right now. Please refresh or try again after a moment.
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard title="Patients This Month" value={kpiData?.patients_this_month} icon={<Users size={20}/>} color="teal" isLoading={kpiLoad} />
          <KPICard title="Reports Today" value={kpiData?.reports_today} icon={<FileText size={20}/>} color="blue" isLoading={kpiLoad} />
          <KPICard title="Pending" value={kpiData?.pending_reports} icon={<Clock size={20}/>} color="amber" isLoading={kpiLoad} />
          <KPICard title="Unread Alerts" value={kpiData?.unread_alerts} icon={<Bell size={20}/>} color={kpiData?.unread_alerts > 0 ? 'red' : 'teal'} isLoading={kpiLoad} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Volume bar chart */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-semibold text-slate-800 mb-4">Daily Report Volume</h2>
            {volLoad ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={volData.slice(-30)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={formatChartDate} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Panel donut */}
          <Card className="p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Panel Mix</h2>
            {panLoad ? <Skeleton className="h-52" /> : panelData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-slate-400">No panel data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={panelData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {panelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Turnaround */}
        <Card className="max-w-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-2">Avg. Turnaround Time</h2>
          <p className="text-xs text-slate-500 mb-4">Draft → Released over last 30 days</p>
          {turnLoad ? <Skeleton className="h-16 w-32" /> : (
            <div>
              <p className="text-4xl font-bold text-teal-600">
                {turnData?.average_hours != null ? `${turnData.average_hours}h` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">across {turnData?.count || 0} released reports</p>
            </div>
          )}
        </Card>
      </div>
    </LabLayout>
  );
}
