import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { settingsService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Input, Select, Textarea, Modal, Badge, Skeleton, EmptyState } from '../../components/common';
import { usePermission } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useLabContext } from '../../hooks/useLabContext';
import { Building2, FlaskConical, Users, Plus, Pencil, Trash2, UserPlus, Eye } from 'lucide-react';

/* ─── Lab Profile Tab ──────────────────────────────────────────────────── */
function LabProfileTab() {
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings-lab'], queryFn: settingsService.getLab, staleTime: 60000 });
  const lab = data?.data;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    values: lab ? { name: lab.name, phone: lab.phone, address: lab.address, primary_color: lab.primary_color || '#0d9488', logo_url: lab.logo_url } : {},
  });
  const previewColor = watch('primary_color');

  const mutation = useMutation({
    mutationFn: (d) => settingsService.updateLab(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-lab'] }); addToast('Lab profile saved!', 'success'); },
    onError: () => addToast('Failed to save.', 'error'),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {/* Color preview accent */}
      <div className="h-2 rounded-xl mb-2" style={{ background: previewColor || '#0d9488' }} />
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Lab Name *" {...register('name', { required: true })} error={errors.name?.message} />
        <Input label="Phone" {...register('phone')} />
      </div>
      <Textarea label="Address" {...register('address')} rows={3} />
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Logo URL" {...register('logo_url')} placeholder="https://…/logo.png" />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Brand Color</label>
          <div className="flex items-center gap-3">
            <input type="color" {...register('primary_color')} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
            <span className="text-sm text-slate-500">{previewColor}</span>
          </div>
        </div>
      </div>
      {canDo('editLabSettings') && (
        <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
      )}
    </form>
  );
}

/* ─── Test Panels Tab ──────────────────────────────────────────────────── */
function PanelsTab() {
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editPanel, setEditPanel] = useState(null);
  const [paramRows, setParamRows] = useState([{ name:'',unit:'',ref_min_male:'',ref_max_male:'',ref_min_female:'',ref_max_female:'',sort_order:0 }]);

  const { data, isLoading } = useQuery({ queryKey: ['settings-panels'], queryFn: settingsService.getPanels, staleTime: 60000 });
  const panels = data?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (d) => settingsService.createPanel({ ...d, parameters: paramRows }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-panels'] }); setShowCreate(false); reset(); setParamRows([{ name:'',unit:'',ref_min_male:'',ref_max_male:'',ref_min_female:'',ref_max_female:'',sort_order:0 }]); addToast('Panel created!', 'success'); },
    onError: () => addToast('Failed to create panel.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => settingsService.deletePanel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-panels'] }); addToast('Panel deactivated.', 'info'); },
  });

  const addParamRow = () => setParamRows(r => [...r, { name:'',unit:'',ref_min_male:'',ref_max_male:'',ref_min_female:'',ref_max_female:'',sort_order:r.length }]);
  const removeParamRow = (i) => setParamRows(r => r.filter((_,j) => j !== i));
  const updateParam = (i, field, val) => setParamRows(r => r.map((p,j) => j === i ? { ...p, [field]: val } : p));

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <>
      {canDo('editLabSettings') && (
        <div className="mb-4">
          <Button onClick={() => setShowCreate(true)}><Plus size={14} />Add Panel</Button>
        </div>
      )}

      {panels.length === 0 ? <EmptyState icon="🔬" title="No panels configured" description="Add your first test panel." /> : (
        <div className="space-y-3">
          {panels.map(panel => (
            <div key={panel.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{panel.name}</span>
                    <Badge variant="teal">{panel.short_code}</Badge>
                    <Badge variant="default">₹{panel.price}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{panel.test_parameters?.length} parameters</p>
                </div>
                {canDo('editLabSettings') && (
                  <div className="flex gap-2">
                    <button onClick={() => deleteMutation.mutate(panel.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 border-t border-slate-100 px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  {panel.test_parameters?.map((p, i) => (
                    <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                      {p.name} ({p.unit})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Panel Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create Test Panel" className="max-w-2xl">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Input label="Panel Name *" {...register('name', { required: true })} /></div>
            <Input label="Short Code *" {...register('short_code', { required: true })} placeholder="CBC" />
          </div>
          <Input label="Price (₹)" type="number" {...register('price', { valueAsNumber: true })} />

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
                  <input value={p.name} onChange={e => updateParam(i,'name',e.target.value)} placeholder="Name" className="col-span-2 input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                  <input value={p.unit} onChange={e => updateParam(i,'unit',e.target.value)} placeholder="Unit" className="input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                  <input value={p.ref_min_male} onChange={e => updateParam(i,'ref_min_male',e.target.value)} placeholder="Min M" type="number" className="input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                  <input value={p.ref_max_male} onChange={e => updateParam(i,'ref_max_male',e.target.value)} placeholder="Max M" type="number" className="input-xs border border-slate-200 rounded px-2 py-1 text-xs" />
                  <button type="button" onClick={() => removeParamRow(i)} className="text-red-400 hover:text-red-600 justify-self-center">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" isLoading={createMutation.isPending}>Create Panel</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ─── Staff Tab ─────────────────────────────────────────────────────────── */
function StaffTab() {
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['settings-staff'], queryFn: settingsService.getStaff, staleTime: 60000 });
  const staff = data?.data || [];

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const inviteMutation = useMutation({
    mutationFn: (d) => settingsService.inviteStaff(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-staff'] }); setShowInvite(false); reset(); addToast('Invite sent!', 'success'); },
    onError: (err) => addToast(err?.response?.data?.error || 'Failed to invite.', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => settingsService.updateStaff(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-staff'] }); addToast('Staff updated.', 'success'); },
  });

  const roleColors = { manager: 'purple', receptionist: 'blue', technician: 'teal' };

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <>
      {canDo('manageStaff') && (
        <div className="mb-4">
          <Button onClick={() => setShowInvite(true)}><UserPlus size={14} />Invite Staff</Button>
        </div>
      )}

      {staff.length === 0 ? <EmptyState icon="👥" title="No staff yet" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                {canDo('manageStaff') && <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staff.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">{s.full_name?.[0]}</div>
                      <span className="font-medium text-slate-800">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">{s.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleColors[s.role] || 'default'} className="capitalize">{s.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.is_active ? 'success' : 'default'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  {canDo('manageStaff') && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => updateMutation.mutate({ id: s.id, is_active: !s.is_active })}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showInvite} onClose={() => { setShowInvite(false); reset(); }} title="Invite Staff">
        <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4">
          <Input label="Full Name *" {...register('full_name', { required: true })} />
          <Input label="Work Email *" type="email" {...register('email', { required: true })} />
          <Select label="Role *" {...register('role', { required: true })} options={[
            { value: '', label: 'Select role' },
            { value: 'manager', label: 'Manager' },
            { value: 'receptionist', label: 'Receptionist' },
            { value: 'technician', label: 'Technician' },
          ]} />
          <div className="flex gap-2">
            <Button type="submit" isLoading={inviteMutation.isPending}>Send Invite</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowInvite(false); reset(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ─── Settings page (tabbed) ──────────────────────────────────────────── */
export default function Settings() {
  const [tab, setTab] = useState('lab');
  const tabs = [
    { id: 'lab',    label: 'Lab Profile',  icon: <Building2 size={14} /> },
    { id: 'panels', label: 'Test Panels',  icon: <FlaskConical size={14} /> },
    { id: 'staff',  label: 'Staff',        icon: <Users size={14} /> },
  ];
  return (
    <LabLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">Manage lab configuration</p>
        </div>
        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === t.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <Card className="p-6">
          {tab === 'lab'    && <LabProfileTab />}
          {tab === 'panels' && <PanelsTab />}
          {tab === 'staff'  && <StaffTab />}
        </Card>
      </div>
    </LabLayout>
  );
}
