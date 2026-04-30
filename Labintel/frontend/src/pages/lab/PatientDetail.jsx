import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientService } from '../../services/patientService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Input, Select, Modal, Skeleton, EmptyState, Badge, StatusBadge, FlagBadge } from '../../components/common';
import { formatDate, calcAge } from '../../utils/formatDate';
import { formatPhone } from '../../utils/formatPhone';
import { usePermission } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useLabPath } from '../../hooks/useLabPath';
import {
  ArrowLeft, User, Phone, Calendar, Edit3, Save, X, FileText, TrendingUp, Bell,
  CheckCircle, Plus, ChevronRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import { getFlagConfig } from '../../utils/flagColor';

const editSchema = z.object({
  full_name: z.string().min(2),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male','female','other']).optional(),
});

function TrendsTab({ patientId }) {
  const [selected, setSelected] = useState(null);
  const { data } = useQuery({
    queryKey: ['patient-trends', patientId],
    queryFn: () => patientService.getTrends(patientId),
    staleTime: 1000 * 60 * 5,
  });
  const groups = (data?.data || []).filter(g => g.data?.length >= 2);
  const active = selected ? groups.find(g => g.parameter?.id === selected) : groups[0];
  if (!groups.length) return <EmptyState icon="📈" title="No trend data" description="Needs 2+ reports with same parameter." />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {groups.map(g => (
          <button key={g.parameter?.id} onClick={() => setSelected(g.parameter?.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${active?.parameter?.id === g.parameter?.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'}`}>
            {g.parameter?.name}
          </button>
        ))}
      </div>
      {active && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{active.parameter?.name} ({active.parameter?.unit})</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={active.data.map(d => ({ date: formatDate(d.date, 'dd MMM'), value: parseFloat(d.value), fill: getFlagConfig(d.flag).barColor }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2}
                dot={({cx, cy, payload}) => <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.fill} stroke="white" strokeWidth={2} />} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

function AlertsTab({ patientId }) {
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['patient-alerts', patientId],
    queryFn: () => patientService.getAlerts(patientId),
  });
  const resolve = useMutation({
    mutationFn: ({ alertId }) => patientService.resolveAlert(patientId, alertId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-alerts', patientId] }); addToast('Alert resolved', 'success'); },
  });
  const alerts = data?.data || [];
  const typeColors = { critical_value: 'border-red-400 bg-red-50', worsening_trend: 'border-amber-400 bg-amber-50', persistent_abnormal: 'border-orange-400 bg-orange-50' };
  if (!alerts.length) return <EmptyState icon="✅" title="No alerts" description="No health alerts for this patient." />;
  return (
    <div className="space-y-3">
      {alerts.map(a => (
        <div key={a.id} className={`border-l-4 rounded-r-xl p-4 ${typeColors[a.alert_type] || 'border-slate-400 bg-slate-50'} ${a.is_read ? 'opacity-50' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={a.alert_type === 'critical_value' ? 'error' : 'warning'}>
                  {a.alert_type?.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-slate-500">{formatDate(a.triggered_at)}</span>
              </div>
              <p className="text-sm text-slate-700">{a.message}</p>
            </div>
            {!a.is_read && (
              <Button size="sm" variant="ghost" onClick={() => resolve.mutate({ alertId: a.id })}>
                <CheckCircle size={14} /> Resolve
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('reports');
  const [editing, setEditing] = useState(false);
  const { canDo, role } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const labPath = useLabPath();

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id),
    staleTime: 1000 * 60 * 5,
  });

  const { data: reportsData } = useQuery({
    queryKey: ['patient-reports', id],
    queryFn: () => patientService.getReports(id),
    enabled: tab === 'reports',
  });

  const lp = data?.data;
  const patient = lp?.patients || {};
  const reports = reportsData?.data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(editSchema),
    values: { full_name: patient.full_name, date_of_birth: patient.date_of_birth, gender: patient.gender },
  });

  const updateMutation = useMutation({
    mutationFn: (d) => patientService.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient', id] }); setEditing(false); addToast('Patient updated!', 'success'); },
    onError: () => addToast('Update failed.', 'error'),
  });

  const age = calcAge(patient.date_of_birth);
  const tabs = [
    { id: 'reports', label: 'Reports', icon: <FileText size={14} /> },
    { id: 'trends',  label: 'Trends',  icon: <TrendingUp size={14} /> },
    ...(['administrator', 'manager'].includes(role) ? [{ id: 'alerts', label: 'Alerts', icon: <Bell size={14} /> }] : []),
  ];

  if (isLoading) return <LabLayout><div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-64" /></div></LabLayout>;

  return (
    <LabLayout>
      <div className="space-y-5">
        {/* Back */}
        <Link to={labPath('patients')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> All Patients
        </Link>

        {/* Profile header */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold">
                {patient.full_name?.[0] || '?'}
              </div>
              {!editing ? (
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{patient.full_name}</h1>
                  <p className="text-sm text-slate-500">{formatPhone(patient.phone)}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    {age && <span>Age: {age}</span>}
                    {patient.gender && <span className="capitalize">{patient.gender}</span>}
                    {patient.date_of_birth && <span>{formatDate(patient.date_of_birth)}</span>}
                    {lp?.lab_patient_code && <Badge variant="default">{lp.lab_patient_code}</Badge>}
                    {lp?.referred_by && <span>Ref: {lp.referred_by}</span>}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-3 min-w-[280px]">
                  <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
                  <Input label="Date of Birth" type="date" {...register('date_of_birth')} />
                  <Select label="Gender" {...register('gender')} options={[
                    { value: '', label: 'Select' }, { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' },
                  ]} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" isLoading={updateMutation.isPending}><Save size={13} />Save</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => { setEditing(false); reset(); }}><X size={13} /></Button>
                  </div>
                </form>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {canDo('registerPatient') && !editing && (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}><Edit3 size={14} />Edit</Button>
              )}
              {canDo('createReport') && (
                <Link to={labPath(`reports/new?patient=${id}`)}>
                  <Button size="sm"><Plus size={14} />New Report</Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === t.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? <EmptyState icon="📋" title="No reports yet" /> : (
              reports.map(r => (
                <Link key={r.id} to={labPath(`reports/${r.id}`)} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{r.test_panels?.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.collected_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                  <ChevronRight size={14} className="text-slate-300" />
                </Link>
              ))
            )}
          </div>
        )}
        {tab === 'trends' && <TrendsTab patientId={id} />}
        {tab === 'alerts' && ['administrator', 'manager'].includes(role) && <AlertsTab patientId={id} />}
      </div>
    </LabLayout>
  );
}
