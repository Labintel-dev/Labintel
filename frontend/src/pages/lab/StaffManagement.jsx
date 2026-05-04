import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Input, Select, Modal, Badge, Skeleton, EmptyState } from '../../components/common';
import { usePermission } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { UserPlus, Users, Shield, Mail, ToggleLeft, ToggleRight } from 'lucide-react';

const roleColors = { manager: 'purple', receptionist: 'blue', technician: 'teal' };

export default function StaffManagement() {
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-staff'],
    queryFn: settingsService.getStaff,
    staleTime: 60000,
  });
  const staff = data?.data || [];

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const inviteMutation = useMutation({
    mutationFn: (d) => settingsService.inviteStaff(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-staff'] });
      setShowInvite(false);
      reset();
      addToast('Invite sent successfully!', 'success');
    },
    onError: (err) => addToast(err?.response?.data?.error || 'Failed to invite.', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => settingsService.updateStaff(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-staff'] });
      addToast('Staff updated.', 'success');
    },
  });

  const activeCount = staff.filter(s => s.is_active).length;
  const roleCounts = {};
  staff.forEach(s => { roleCounts[s.role] = (roleCounts[s.role] || 0) + 1; });

  return (
    <LabLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
            <p className="text-sm text-slate-500">
              {staff.length} total staff · {activeCount} active
            </p>
          </div>
          {canDo('manageStaff') && (
            <Button onClick={() => setShowInvite(true)} className="w-full sm:w-auto">
              <UserPlus size={15} />Invite Staff
            </Button>
          )}
        </div>

        {/* Role summary cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {['manager', 'receptionist', 'technician'].map(role => (
            <Card key={role} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-slate-400" />
                <Badge variant={roleColors[role]} className="capitalize">{role}</Badge>
              </div>
              <p className="text-2xl font-bold text-slate-800">{roleCounts[role] || 0}</p>
            </Card>
          ))}
        </div>

        {/* Staff table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : staff.length === 0 ? (
            <EmptyState icon="👥" title="No staff yet" description="Invite your first team member." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    {canDo('manageStaff') && (
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {staff.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {s.full_name?.[0]}
                          </div>
                          <span className="font-medium text-slate-800">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          {s.email}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={roleColors[s.role] || 'default'} className="capitalize">{s.role}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={s.is_active ? 'success' : 'default'}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      {canDo('manageStaff') && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => updateMutation.mutate({ id: s.id, is_active: !s.is_active })}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors"
                          >
                            {s.is_active ? (
                              <><ToggleRight size={16} className="text-emerald-500" /> Deactivate</>
                            ) : (
                              <><ToggleLeft size={16} className="text-slate-400" /> Activate</>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Invite Modal */}
        <Modal open={showInvite} onClose={() => { setShowInvite(false); reset(); }} title="Invite Staff Member">
          <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4">
            <Input label="Full Name *" {...register('full_name', { required: true })} placeholder="e.g. Dr. Jane Smith" />
            <Input label="Work Email *" type="email" {...register('email', { required: true })} placeholder="jane@lab.com" />
            <Select label="Role *" {...register('role', { required: true })} options={[
              { value: '', label: 'Select role' },
              { value: 'manager', label: 'Manager' },
              { value: 'receptionist', label: 'Receptionist' },
              { value: 'technician', label: 'Technician' },
            ]} />
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button type="submit" isLoading={inviteMutation.isPending}>Send Invite</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowInvite(false); reset(); }}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </LabLayout>
  );
}
