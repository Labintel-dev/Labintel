import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Input, Textarea, Skeleton } from '../../components/common';
import { usePermission } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { Building2, Palette, Phone, MapPin, Image } from 'lucide-react';

export default function LabSettings() {
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['settings-lab'],
    queryFn: settingsService.getLab,
    staleTime: 60000,
  });
  const lab = data?.data;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    values: lab ? {
      name: lab.name,
      phone: lab.phone,
      address: lab.address,
      primary_color: lab.primary_color || '#0d9488',
      logo_url: lab.logo_url,
    } : {},
  });
  const previewColor = watch('primary_color');

  const mutation = useMutation({
    mutationFn: (d) => settingsService.updateLab(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-lab'] });
      addToast('Lab profile saved!', 'success');
    },
    onError: () => addToast('Failed to save.', 'error'),
  });

  return (
    <LabLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lab Settings</h1>
          <p className="text-sm text-slate-500">Manage your lab's profile and branding</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card className="p-6">
            {/* Color preview accent */}
            <div className="h-2 rounded-xl mb-6" style={{ background: previewColor || '#0d9488' }} />

            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
              {/* Lab info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-slate-400" />
                  Lab Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Lab Name *" {...register('name', { required: true })} error={errors.name?.message} />
                  <Input label="Phone" {...register('phone')} prefix={<Phone size={14} />} />
                </div>
                <div className="mt-4">
                  <Textarea label="Address" {...register('address')} rows={3} />
                </div>
              </div>

              {/* Branding */}
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Palette size={16} className="text-slate-400" />
                  Branding
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Logo URL" {...register('logo_url')} placeholder="https://…/logo.png" />
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" {...register('primary_color')} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                      <span className="text-sm text-slate-500 font-mono">{previewColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {lab?.logo_url && (
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Image size={16} className="text-slate-400" />
                    Logo Preview
                  </h3>
                  <div className="w-24 h-24 border border-slate-200 rounded-xl p-2 bg-white">
                    <img src={lab.logo_url} alt="Lab Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {canDo('editLabSettings') && (
                <div className="border-t border-slate-100 pt-5">
                  <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
                </div>
              )}
            </form>
          </Card>
        )}
      </div>
    </LabLayout>
  );
}
