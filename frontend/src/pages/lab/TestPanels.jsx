import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Input, Modal, Badge, Skeleton, EmptyState } from '../../components/common';
import { usePermission } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { Plus, Trash2, Beaker, Edit3, ChevronDown, ChevronUp } from 'lucide-react';

export default function TestPanels() {
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [paramRows, setParamRows] = useState([
    { name: '', unit: '', ref_min_male: '', ref_max_male: '', ref_min_female: '', ref_max_female: '', sort_order: 0 },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-panels'],
    queryFn: settingsService.getPanels,
    staleTime: 60000,
  });
  const panels = data?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (d) => settingsService.createPanel({ ...d, parameters: paramRows }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-panels'] });
      setShowCreate(false);
      reset();
      setParamRows([{ name: '', unit: '', ref_min_male: '', ref_max_male: '', ref_min_female: '', ref_max_female: '', sort_order: 0 }]);
      addToast('Test panel created!', 'success');
    },
    onError: () => addToast('Failed to create panel.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => settingsService.deletePanel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-panels'] });
      addToast('Panel deactivated.', 'info');
    },
  });

  const addParamRow = () => setParamRows(r => [...r, {
    name: '', unit: '', ref_min_male: '', ref_max_male: '', ref_min_female: '', ref_max_female: '', sort_order: r.length,
  }]);
  const removeParamRow = (i) => setParamRows(r => r.filter((_, j) => j !== i));
  const updateParam = (i, field, val) => setParamRows(r => r.map((p, j) => j === i ? { ...p, [field]: val } : p));

  return (
    <LabLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Test Panels</h1>
            <p className="text-sm text-slate-500">{panels.length} active test panels</p>
          </div>
          {canDo('editLabSettings') && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={15} />Add Panel
            </Button>
          )}
        </div>

        {/* Panels list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : panels.length === 0 ? (
          <EmptyState icon="🔬" title="No panels configured" description="Add your first test panel." />
        ) : (
          <div className="space-y-3">
            {panels.map(panel => (
              <Card key={panel.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedPanel(expandedPanel === panel.id ? null : panel.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Beaker size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{panel.name}</span>
                        <Badge variant="teal">{panel.short_code}</Badge>
                        <Badge variant="default">₹{panel.price}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{panel.test_parameters?.length || 0} parameters</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canDo('editLabSettings') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(panel.id); }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {expandedPanel === panel.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>
                {expandedPanel === panel.id && (
                  <div className="bg-slate-50 border-t border-slate-100 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {panel.test_parameters?.map((p, i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 px-3 py-2">
                          <p className="text-sm font-medium text-slate-700">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {p.unit} · Male: {p.ref_min_male}–{p.ref_max_male} · Female: {p.ref_min_female || p.ref_min_male}–{p.ref_max_female || p.ref_max_male}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Create Panel Modal */}
        <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create Test Panel" className="max-w-2xl">
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input label="Panel Name *" {...register('name', { required: true })} placeholder="Complete Blood Count" />
              </div>
              <Input label="Short Code *" {...register('short_code', { required: true })} placeholder="CBC" />
            </div>
            <Input label="Price (₹)" type="number" {...register('price', { valueAsNumber: true })} placeholder="500" />

            {/* Parameters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">Parameters</label>
                <button type="button" onClick={addParamRow} className="text-xs text-teal-600 font-medium flex items-center gap-1">
                  <Plus size={12} />Add
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                {paramRows.map((p, i) => (
                  <div key={i} className="grid grid-cols-6 gap-1.5 items-center p-2 bg-slate-50 rounded-lg">
                    <input value={p.name} onChange={e => updateParam(i, 'name', e.target.value)} placeholder="Name" className="col-span-2 input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                    <input value={p.unit} onChange={e => updateParam(i, 'unit', e.target.value)} placeholder="Unit" className="input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                    <input value={p.ref_min_male} onChange={e => updateParam(i, 'ref_min_male', e.target.value)} placeholder="Min M" type="number" className="input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                    <input value={p.ref_max_male} onChange={e => updateParam(i, 'ref_max_male', e.target.value)} placeholder="Max M" type="number" className="input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                    <button type="button" onClick={() => removeParamRow(i)} className="text-red-400 hover:text-red-600 justify-self-center">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" isLoading={createMutation.isPending}>Create Panel</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </LabLayout>
  );
}
