import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientService } from '../../services/patientService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Input, Select, Modal, Skeleton, EmptyState, Badge } from '../../components/common';
import { formatDate, calcAge } from '../../utils/formatDate';
import { formatPhone } from '../../utils/formatPhone';
import { usePermission } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useLabPath } from '../../hooks/useLabPath';
import { Search, Plus, ChevronRight, Users, UserPlus } from 'lucide-react';


function useDebounceValue(val, delay) {
  const [debounced, setDebounced] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return debounced;
}

const createSchema = z.object({
  full_name:        z.string().min(2),
  phone:            z.string().regex(/^\+91[6-9]\d{9}$/, 'Format: +91XXXXXXXXXX'),
  date_of_birth:    z.string().optional(),
  gender:           z.enum(['male','female','other']).optional(),
  lab_patient_code: z.string().optional(),
  referred_by:      z.string().optional(),
});

export default function Patients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const lp = useLabPath();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { search, page }],
    queryFn: () => patientService.getAll({ search, page, limit: 20 }),
    staleTime: 1000 * 30,
  });

  const patients = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (d) => patientService.create(d),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setShowCreate(false);
      reset();
      addToast('Patient registered!', 'success');
      navigate(lp(`patients/${result.data.patient?.id}`));
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to register patient.';
      addToast(msg, 'error');
    },
  });

  return (
    <LabLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-sm text-slate-500">{total} total registered</p>
        </div>
        {canDo('registerPatient') && (
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
            <UserPlus size={15} /> Register Patient
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or phone…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
        ) : patients.length === 0 ? (
          <EmptyState icon="👥" title="No patients found" description={search ? 'Try a different search term.' : 'Register your first patient.'} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Age/Gender</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Registered</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map((row) => {
                    const p = row.patients || {};
                    const age = calcAge(p.date_of_birth);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                              {p.full_name?.[0] || '?'}
                            </div>
                            <span className="font-semibold text-slate-800">{p.full_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 hidden md:table-cell">{formatPhone(p.phone)}</td>
                        <td className="px-4 py-3.5 text-slate-600 hidden lg:table-cell">
                          {age ? `${age} yr` : '—'}{p.gender ? ` · ${p.gender[0].toUpperCase()}` : ''}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {row.lab_patient_code ? <Badge variant="default">{row.lab_patient_code}</Badge> : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell text-xs">{formatDate(row.registered_at)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={lp(`patients/${p.id}`)} className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 justify-end">
                            View <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Patient Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Register New Patient" className="max-w-xl">
        {showCreate ? (
          <form onSubmit={handleSubmit((d) => {
            console.log('Submitting patient:', d);
            createMutation.mutate(d);
          })} className="space-y-5">
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <Input 
                  label="Full Name *" 
                  {...register('full_name')} 
                  error={errors.full_name?.message} 
                  placeholder="Patient's full name" 
                  autoFocus
                />
              </div>

              {/* Phone */}
              <div>
                <Input 
                  label="Phone Number *" 
                  {...register('phone')} 
                  error={errors.phone?.message} 
                  placeholder="+919876543210" 
                />
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Input 
                    label="Date of Birth" 
                    type="date" 
                    {...register('date_of_birth')} 
                  />
                </div>
                <div>
                  <Select 
                    label="Gender" 
                    {...register('gender')} 
                    options={[
                      { value: '', label: 'Select' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]} 
                  />
                </div>
              </div>

              {/* Lab Code & Referred By */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Input 
                    label="Lab Code" 
                    {...register('lab_patient_code')} 
                    placeholder="e.g. SUN-042" 
                  />
                </div>
                <div>
                  <Input 
                    label="Referred By" 
                    {...register('referred_by')} 
                    placeholder="Dr. Name" 
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {createMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  {createMutation.error?.response?.data?.error || 'Failed to register patient'}
                </p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
              <Button 
                type="submit" 
                className="flex-1" 
                isLoading={createMutation.isPending}
              >
                Register Patient
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => { setShowCreate(false); reset(); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </LabLayout>
  );
}
