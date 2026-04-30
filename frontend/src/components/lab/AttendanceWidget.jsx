import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { Card, Button, Skeleton } from '../common';
import { cn } from '../../utils/cn';
import {
  Clock, CheckCircle2, LogIn, LogOut, CalendarDays,
  TrendingUp, AlertCircle,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryPill({ label, value, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red:     'bg-red-50 text-red-700 border-red-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    teal:    'bg-teal-50 text-teal-700 border-teal-200',
  };
  return (
    <div className={cn('flex flex-col items-center py-3 px-4 rounded-xl border text-center', colors[color])}>
      <span className="text-2xl font-bold">{value ?? '—'}</span>
      <span className="text-[11px] font-medium mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

/**
 * AttendanceWidget — shown on Receptionist / Technician dashboards.
 * Lets staff check in, check out, and see their month's attendance summary.
 */
export function AttendanceWidget() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState(null);

  // Fetch personal monthly attendance (includes today's record if it exists)
  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ['my-attendance'],
    queryFn:  attendanceService.getMyAttendance,
    staleTime: 1000 * 60,          // 1 min
    refetchInterval: 1000 * 60 * 5, // re-poll every 5 min
  });

  const records = data?.data?.records || [];
  const summary = data?.data?.summary || {};

  // Find today's record (date is YYYY-MM-DD, compare against server date)
  const todayISO = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local
  const todayRecord = records.find(r => r.date === todayISO);

  const hasCheckedIn  = Boolean(todayRecord?.check_in);
  const hasCheckedOut = Boolean(todayRecord?.check_out);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const refetchAttendance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
  }, [queryClient]);

  const checkInMutation = useMutation({
    mutationFn: attendanceService.checkIn,
    onSuccess: () => {
      setActionError(null);
      refetchAttendance();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Check-in failed. Please try again.';
      setActionError(msg);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceService.checkOut,
    onSuccess: () => {
      setActionError(null);
      refetchAttendance();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Check-out failed. Please try again.';
      setActionError(msg);
    },
  });

  // ── Status display ──────────────────────────────────────────────────────────
  const statusConfig = (() => {
    if (hasCheckedOut) return {
      icon:  <CheckCircle2 size={20} className="text-teal-600" />,
      label: 'Checked Out',
      sub:   `Left at ${formatTime(todayRecord?.check_out)}`,
      dot:   'bg-teal-500',
    };
    if (hasCheckedIn) return {
      icon:  <Clock size={20} className="text-blue-600" />,
      label: 'Currently In',
      sub:   `Since ${formatTime(todayRecord?.check_in)}`,
      dot:   'bg-blue-500 animate-pulse',
    };
    return {
      icon:  <CalendarDays size={20} className="text-slate-400" />,
      label: 'Not Checked In',
      sub:   'Mark your attendance below',
      dot:   'bg-slate-300',
    };
  })();

  const attendancePct = summary.total_recorded > 0
    ? Math.round(((summary.total_present ?? 0) + (summary.total_half_day ?? 0) * 0.5) / summary.total_recorded * 100)
    : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-teal-100 uppercase tracking-wide">My Attendance</p>
            <p className="text-sm font-semibold mt-0.5 text-teal-50">{todayLabel()}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <span className={cn('w-2 h-2 rounded-full', statusConfig.dot)} />
            <span className="text-xs font-semibold">{statusConfig.label}</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Today's status card */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
            {statusConfig.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{statusConfig.label}</p>
            <p className="text-xs text-slate-500">{statusConfig.sub}</p>
          </div>
          {hasCheckedIn && todayRecord?.check_in && (
            <div className="ml-auto text-right shrink-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Check-in</p>
              <p className="text-sm font-bold text-slate-700">{formatTime(todayRecord.check_in)}</p>
            </div>
          )}
        </div>

        {/* Error alert */}
        {actionError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Action buttons */}
        {isLoading ? (
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              id="attendance-check-in-btn"
              variant={hasCheckedIn ? 'secondary' : 'primary'}
              className="flex-1"
              disabled={hasCheckedIn}
              isLoading={checkInMutation.isPending}
              onClick={() => checkInMutation.mutate()}
            >
              <LogIn size={16} />
              {hasCheckedIn ? 'Checked In ✓' : 'Mark Attendance'}
            </Button>

            {hasCheckedIn && (
              <Button
                id="attendance-check-out-btn"
                variant={hasCheckedOut ? 'secondary' : 'outline'}
                className="flex-1"
                disabled={hasCheckedOut}
                isLoading={checkOutMutation.isPending}
                onClick={() => checkOutMutation.mutate()}
              >
                <LogOut size={16} />
                {hasCheckedOut ? 'Checked Out ✓' : 'Check Out'}
              </Button>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Monthly summary */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={14} className="text-teal-600" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">This Month</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : fetchError ? (
            <p className="text-xs text-slate-400 text-center py-4">Could not load attendance data.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <SummaryPill
                label="Present"
                value={summary.total_present ?? 0}
                color="emerald"
              />
              <SummaryPill
                label="Absent"
                value={summary.total_absent ?? 0}
                color="red"
              />
              <SummaryPill
                label="Attend %"
                value={attendancePct !== null ? `${attendancePct}%` : '—'}
                color={
                  attendancePct === null    ? 'teal'
                  : attendancePct >= 90    ? 'emerald'
                  : attendancePct >= 75    ? 'amber'
                  : 'red'
                }
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
