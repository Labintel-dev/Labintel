import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../../services/patientService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Badge, Button, EmptyState, Skeleton } from '../../components/common';
import { formatDate } from '../../utils/formatDate';
import { useLabPath } from '../../hooks/useLabPath';
import { Bell, CheckCircle, ExternalLink, Filter } from 'lucide-react';

const TYPE_CONFIG = {
  critical_value:    { label: 'Critical Value',     borderColor: 'border-red-500',    bg: 'bg-red-50',    badge: 'error' },
  worsening_trend:   { label: 'Worsening Trend',    borderColor: 'border-amber-500',  bg: 'bg-amber-50',   badge: 'warning' },
  persistent_abnormal:{ label: 'Persistent Abnormal',borderColor: 'border-orange-500', bg: 'bg-orange-50', badge: 'warning' },
};

const TABS = ['all', 'unread', 'critical'];

export default function Alerts() {
  const [tab, setTab] = useState('unread');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const lp = useLabPath();

  // Fetch all patients' alerts by querying through patients list
  // The API doesn't have a global /alerts endpoint, so we use the dashboard unread count
  // For demo: fetch alerts per patient — in real app you'd have a dedicated route
  const { data: patientData } = useQuery({
    queryKey: ['patients', {}],
    queryFn: () => patientService.getAll({ limit: 100 }),
    staleTime: 60000,
  });

  // We'll aggregate alerts from all patients 
  const allPatientIds = (patientData?.data || []).map(lp => lp.patients?.id);
  
  // Query alerts for up to first 20 patients (in production, use a /alerts global endpoint)
  const patientIds = allPatientIds.slice(0, 20);
  const alertQueries = useQuery({
    queryKey: ['all-alerts', patientIds],
    queryFn: async () => {
      const results = await Promise.allSettled(
        patientIds.map(id => patientService.getAlerts(id).then(r => (r.data || []).map(a => ({ ...a, patient_id: id }))))
      );
      return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    },
    enabled: patientIds.length > 0,
    staleTime: 60000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ patientId, alertId }) => patientService.resolveAlert(patientId, alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-alerts'] }),
  });

  const allAlerts = (alertQueries.data || [])
    .sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at));

  const filtered = allAlerts.filter(a => {
    if (tab === 'unread' && a.is_read) return false;
    if (tab === 'critical' && a.alert_type !== 'critical_value') return false;
    return true;
  });

  return (
    <LabLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Health Alerts</h1>
            <p className="text-sm text-slate-500">{allAlerts.filter(a => !a.is_read).length} unread alerts</p>
          </div>
          <Bell size={24} className="text-slate-400" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Alerts list */}
        {alertQueries.isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="✅" title="No alerts" description={tab === 'unread' ? 'All alerts have been reviewed.' : 'No alerts in this category.'} />
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const cfg = TYPE_CONFIG[a.alert_type] || { label: a.alert_type, borderColor: 'border-slate-400', bg: 'bg-slate-50', badge: 'default' };
              const patient = patientData?.data?.find(lp => lp.patients?.id === a.patient_id)?.patients;
              return (
                <div key={a.id} className={`border-l-4 rounded-r-xl p-4 ${cfg.borderColor} ${cfg.bg} ${a.is_read ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <Badge variant={cfg.badge}>{cfg.label}</Badge>
                        {patient && <span className="text-sm font-semibold text-slate-800">{patient.full_name}</span>}
                        <span className="text-xs text-slate-400">{formatDate(a.triggered_at)}</span>
                        {!a.is_read && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                      </div>
                      <p className="text-sm text-slate-700">{a.message}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {patient && (
                        <Link to={lp(`patients/${a.patient_id}`)} className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
                          <ExternalLink size={12} />Patient
                        </Link>
                      )}
                      {!a.is_read && (
                        <button
                          onClick={() => resolveMutation.mutate({ patientId: a.patient_id, alertId: a.id })}
                          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-emerald-600 transition-colors"
                        >
                          <CheckCircle size={14} /> Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LabLayout>
  );
}
