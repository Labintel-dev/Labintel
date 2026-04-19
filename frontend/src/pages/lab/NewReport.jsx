import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientService } from '../../services/patientService';
import { reportService } from '../../services/reportService';
import { settingsService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Select, Skeleton } from '../../components/common';
import { useUIStore } from '../../store/uiStore';
import { getFlagConfig } from '../../utils/flagColor';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

const schema = z.object({
  patient_id:   z.string().uuid('Required'),
  panel_id:     z.string().uuid('Required'),
  collected_at: z.string().min(1, 'Required'),
  values:       z.array(z.object({
    parameter_id: z.string(),
    value:        z.string().min(1, 'Required'),
  })),
});

export default function NewReport() {
  const [step, setStep]         = useState(1); // 1: select, 2: values, 3: review
  const [params, setParams]     = useState([]);
  const [selectedPanel, setSelPanel] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [searchParams] = useSearchParams();
  const prePatient = searchParams.get('patient');

  const { data: patientsData } = useQuery({ queryKey: ['patients', {}], queryFn: () => patientService.getAll({ limit: 100 }), staleTime: 60000 });
  const { data: panelsData }   = useQuery({ queryKey: ['panels'], queryFn: settingsService.getPanels, staleTime: 60000 });

  const patients = patientsData?.data || [];
  const panels   = panelsData?.data  || [];

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { patient_id: prePatient || '', panel_id: '', collected_at: new Date().toISOString().slice(0, 16), values: [] },
  });

  const watchPanel = watch('panel_id');
  const watchValues = watch('values');

  const handlePanelChange = (panelId) => {
    setValue('panel_id', panelId);
    const p = panels.find(p => p.id === panelId);
    setSelPanel(p);
    const sorted = [...(p?.test_parameters || [])].sort((a,b) => (a.sort_order||0)-(b.sort_order||0));
    setParams(sorted);
    setValue('values', sorted.map(param => ({ parameter_id: param.id, value: '' })));
  };

  const createMutation = useMutation({
    mutationFn: (d) => reportService.create({ ...d, values: d.values.map(v => ({ ...v, value: parseFloat(v.value) })) }),
    onSuccess: (result) => {
      addToast('Report created! AI analysis running…', 'success');
      navigate(`/reports/${result.data.id}`);
    },
    onError: (err) => addToast(err?.response?.data?.error || 'Failed to create report.', 'error'),
  });

  // Compute preview flags for step 3
  const patientId = watch('patient_id');
  const patient = patients.find(lp => lp.patients?.id === patientId)?.patients;
  const isFemale = patient?.gender === 'female';

  const previewValues = watchValues.map((v, i) => {
    const p = params[i];
    if (!p || !v.value) return null;
    const refMin = isFemale ? p.ref_min_female : p.ref_min_male;
    const refMax = isFemale ? p.ref_max_female : p.ref_max_male;
    let flag = 'normal';
    const val = parseFloat(v.value);
    if (refMin != null && refMax != null) {
      const range = refMax - refMin;
      const ct = range * 0.2;
      if (val < refMin - ct) flag = 'critical_low';
      else if (val > refMax + ct) flag = 'critical_high';
      else if (val < refMin) flag = 'low';
      else if (val > refMax) flag = 'high';
    }
    return { ...p, value: v.value, flag };
  }).filter(Boolean);

  return (
    <LabLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">New Report</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 mb-6">
          {['Select Patient & Panel', 'Enter Values', 'Review & Submit'].map((s, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < step ? 'bg-teal-600' : i === step - 1 ? 'bg-teal-400' : 'bg-slate-200'}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
          {/* Step 1 */}
          {step === 1 && (
            <Card className="p-6 space-y-4">
              <h2 className="font-semibold text-slate-800">Step 1: Patient & Panel</h2>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Patient *</label>
                <select
                  {...register('patient_id')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select patient…</option>
                  {patients.map(lp => (
                    <option key={lp.patients?.id} value={lp.patients?.id}>{lp.patients?.full_name} ({lp.lab_patient_code || lp.patients?.phone})</option>
                  ))}
                </select>
                {errors.patient_id && <p className="text-xs text-red-600 mt-1">{errors.patient_id.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Test Panel *</label>
                <select
                  value={watchPanel}
                  onChange={e => handlePanelChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select panel…</option>
                  {panels.map(p => <option key={p.id} value={p.id}>{p.name} ({p.short_code})</option>)}
                </select>
                {errors.panel_id && <p className="text-xs text-red-600 mt-1">{errors.panel_id.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Collection Date & Time *</label>
                <input type="datetime-local" {...register('collected_at')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <Button type="button" onClick={() => setStep(2)} disabled={!watch('patient_id') || !watch('panel_id')}>
                Next: Enter Values <ArrowRight size={15} />
              </Button>
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card className="p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Step 2: Enter Test Values</h2>
              <div className="space-y-3">
                {params.map((p, i) => {
                  const isFem = isFemale;
                  const refMin = isFem ? p.ref_min_female : p.ref_min_male;
                  const refMax = isFem ? p.ref_max_female : p.ref_max_male;
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                        {refMin != null && refMax != null && (
                          <p className="text-xs text-slate-500">Ref: {refMin}–{refMax} {p.unit}</p>
                        )}
                      </div>
                      <input
                        type="number"
                        step="any"
                        {...register(`values.${i}.value`)}
                        placeholder="0.0"
                        className="w-28 text-right rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-xs text-slate-400 w-12 shrink-0">{p.unit}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}><ArrowLeft size={15} />Back</Button>
                <Button type="button" onClick={() => setStep(3)}>Review Results <ArrowRight size={15} /></Button>
              </div>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <Card className="p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Step 3: Review & Submit</h2>
              <div className="rounded-xl border border-slate-100 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Parameter</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Value</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {previewValues.map((v, i) => {
                      const cfg = getFlagConfig(v.flag);
                      return (
                        <tr key={i} className={v.flag !== 'normal' ? 'bg-red-50/50' : ''}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{v.name}</td>
                          <td className="px-3 py-2.5 text-center font-bold">{v.value} {v.unit}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}><ArrowLeft size={15} />Back</Button>
                <Button type="submit" isLoading={createMutation.isPending} className="flex-1">
                  <Send size={15} /> Submit Report
                </Button>
              </div>
            </Card>
          )}
        </form>
      </div>
    </LabLayout>
  );
}
