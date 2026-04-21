import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientService } from '../../services/patientService';
import { PatientLayout } from '../../components/patient/PatientLayout';
import { Card, Button, Input, Select, Skeleton } from '../../components/common';
import { formatDate, calcAge } from '../../utils/formatDate';
import { maskPhone } from '../../utils/formatPhone';
import { useUIStore } from '../../store/uiStore';
import { User, Phone, Calendar, Edit3, Save, X } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export default function PatientProfile() {
  const [editing, setEditing] = useState(false);
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: patientService.portal.getMyProfile,
    staleTime: 1000 * 60 * 5,
  });
  const profile = data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    values: profile ? { full_name: profile.full_name, date_of_birth: profile.date_of_birth, gender: profile.gender } : {},
  });

  const mutation = useMutation({
    mutationFn: (fd) => patientService.portal.updateMyProfile(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-profile'] });
      setEditing(false);
      addToast('Profile updated!', 'success');
    },
    onError: () => addToast('Failed to update profile.', 'error'),
  });

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <PatientLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal details</p>
        </div>

        {isLoading ? <Skeleton className="h-64 w-full" /> : (
          <Card className="p-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-teal-200">
                {profile?.full_name?.[0] || 'P'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{profile?.full_name || 'Patient'}</h2>
                <p className="text-sm text-slate-500">{maskPhone(profile?.phone)}</p>
                {profile?.date_of_birth && (
                  <p className="text-xs text-slate-400 mt-0.5">Age: {calcAge(profile.date_of_birth)} years</p>
                )}
              </div>
            </div>

            {!editing ? (
              <>
                <InfoRow icon={<User size={15} />} label="Full Name" value={profile?.full_name} />
                <InfoRow icon={<Phone size={15} />} label="Phone" value={maskPhone(profile?.phone)} />
                <InfoRow icon={<Calendar size={15} />} label="Date of Birth" value={profile?.date_of_birth ? formatDate(profile.date_of_birth) : null} />
                <InfoRow icon={<User size={15} />} label="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
                <div className="mt-4">
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Edit3 size={14} /> Edit Profile
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <Input
                  label="Full Name"
                  {...register('full_name')}
                  error={errors.full_name?.message}
                  placeholder="Your full name"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  {...register('date_of_birth')}
                  max={new Date().toISOString().split('T')[0]}
                />
                <Select
                  label="Gender"
                  {...register('gender')}
                  options={[
                    { value: '', label: 'Select gender' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <div className="flex gap-2 pt-2">
                  <Button type="submit" isLoading={mutation.isPending}>
                    <Save size={14} /> Save
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => { setEditing(false); reset(); }}>
                    <X size={14} /> Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}
      </div>
    </PatientLayout>
  );
}
