import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Select, Skeleton, KPICard } from '../../components/common';
import { cn } from '../../utils/cn';
import {
  Users, Clock, CalendarX, TrendingUp,
  Filter, Download, AlertCircle,
  CalendarDays,
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

function formatShift(minutes) {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/** Returns 'YYYY-MM' string for the current month. */
function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    present:  { label: 'Present',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    absent:   { label: 'Absent',   cls: 'bg-red-50 text-red-700 border-red-200'             },
    half_day: { label: 'Half Day', cls: 'bg-amber-50 text-amber-700 border-amber-200'       },
  };
  const cfg = map[status] || { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-emerald-500': status === 'present',
        'bg-red-500':     status === 'absent',
        'bg-amber-500':   status === 'half_day',
        'bg-slate-400':   !['present','absent','half_day'].includes(status),
      })} />
      {cfg.label}
    </span>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCSV(records) {
  const headers = ['Staff Name', 'Role', 'Date', 'Check-in', 'Check-out', 'Shift Duration', 'Status'];
  const rows = records.map(r => [
    r.full_name  ?? '',
    r.role       ?? '',
    r.date       ?? '',
    r.check_in   ? new Date(r.check_in).toLocaleTimeString('en-IN')  : '',
    r.check_out  ? new Date(r.check_out).toLocaleTimeString('en-IN') : '',
    r.shift_duration_minutes != null ? `${Math.floor(r.shift_duration_minutes/60)}h ${r.shift_duration_minutes%60}m` : '',
    r.status     ?? '',
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `attendance-${currentMonthStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ── Month picker (native <input type="month">) ────────────────────────────────

function MonthPicker({ value, onChange }) {
  return (
    <input
      id="attendance-month-picker"
      type="month"
      value={value}
      max={currentMonthStr()}
      onChange={e => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StaffTracking() {
  const [month,      setMonth]      = useState(currentMonthStr());
  const [roleFilter, setRoleFilter] = useState('all');

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: allData,
    isLoading: allLoading,
    error: allError,
  } = useQuery({
    queryKey: ['attendance-all', month, roleFilter],
    queryFn: () => attendanceService.getAllAttendance({
      month,
      role: roleFilter !== 'all' ? roleFilter : undefined,
    }),
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: summaryData,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ['attendance-summary', month],
    queryFn: () => attendanceService.getSummary({ month }),
    staleTime: 1000 * 60 * 2,
  });

  const records  = allData?.data     || [];
  const summary  = summaryData?.data || [];

  // ── Derived KPIs ───────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const isCurrentMonth = month === currentMonthStr();
    const todayISO = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    const presentToday = isCurrentMonth
      ? records.filter(r => r.date === todayISO && r.status === 'present').length
      : null;
    const absentToday  = isCurrentMonth
      ? records.filter(r => r.date === todayISO && r.status === 'absent').length
      : null;

    const totalStaff   = summary.length;
    const avgAttendance = summary.length > 0
      ? Math.round(summary.reduce((acc, s) => acc + (s.attendance_percentage ?? 0), 0) / summary.length)
      : null;

    return { presentToday, absentToday, totalStaff, avgAttendance };
  }, [records, summary, month]);

  const roleFilterOptions = [
    { value: 'all',          label: 'All Roles'    },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'technician',   label: 'Technician'   },
  ];

  const isLoading = allLoading || summaryLoading;
  const isCurrentMonth = month === currentMonthStr();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <LabLayout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Staff Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">Live attendance monitoring and monthly performance tracking</p>
      </div>

      <div className="space-y-6">

        {/* ── KPI Summary Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Staff"
            value={summaryLoading ? undefined : kpis.totalStaff}
            sub="Tracked this month"
            icon={<Users size={20} />}
            color="teal"
            isLoading={summaryLoading}
          />
          {isCurrentMonth ? (
            <>
              <KPICard
                title="Present Today"
                value={allLoading ? undefined : kpis.presentToday}
                sub="Checked in today"
                icon={<CalendarDays size={20} />}
                color="blue"
                isLoading={allLoading}
              />
              <KPICard
                title="Absent Today"
                value={allLoading ? undefined : kpis.absentToday}
                sub="Marked absent"
                icon={<CalendarX size={20} />}
                color="red"
                isLoading={allLoading}
              />
            </>
          ) : (
            <>
              <div /> {/* spacer */}
              <div /> {/* spacer */}
            </>
          )}
          <KPICard
            title="Avg Attendance"
            value={summaryLoading ? undefined : (kpis.avgAttendance != null ? `${kpis.avgAttendance}%` : '—')}
            sub="Across all staff"
            icon={<TrendingUp size={20} />}
            color="amber"
            isLoading={summaryLoading}
          />
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Filter Records</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <MonthPicker value={month} onChange={setMonth} />
              <div className="w-full sm:w-48">
                <Select
                  id="attendance-role-filter"
                  options={roleFilterOptions}
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                />
              </div>
              <Button
                id="attendance-export-csv-btn"
                variant="secondary"
                className="shrink-0"
                disabled={records.length === 0}
                onClick={() => exportCSV(records)}
              >
                <Download size={16} />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Attendance records table — 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-teal-600" />
                  <h2 className="font-semibold text-slate-800">Attendance Records</h2>
                </div>
                {!isLoading && records.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">{records.length} records</span>
                )}
              </div>

              {/* Error state */}
              {allError && !allLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                  <AlertCircle size={32} className="text-red-400" />
                  <p className="text-sm font-semibold text-slate-700">Failed to load attendance records</p>
                  <p className="text-xs text-slate-400">
                    {allError?.response?.data?.error || 'Please check your connection and try again.'}
                  </p>
                </div>
              )}

              {/* Loading state */}
              {allLoading && <TableSkeleton />}

              {/* Table */}
              {!allLoading && !allError && (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Staff Member</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Check-in</th>
                        <th className="px-4 py-3">Check-out</th>
                        <th className="px-4 py-3">Shift</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {records.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-800">{r.full_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{r.role}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs font-medium">
                            {r.date
                              ? new Date(r.date).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {formatTime(r.check_in)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {r.check_out ? formatTime(r.check_out) : (
                              r.status === 'present'
                                ? <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">Still In</span>
                                : '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatShift(r.shift_duration_minutes)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}

                      {records.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                            <CalendarDays size={32} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-medium text-slate-500">No attendance records found</p>
                            <p className="text-xs mt-1">Try adjusting the month or role filter.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Absence tracker / monthly summary — 1/3 width */}
          <div>
            <Card className="h-full flex flex-col">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Monthly Summary</h2>
                <p className="text-xs text-slate-400 mt-1">Per-staff attendance for {month}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {summaryLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : summary.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock size={28} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No summary data available.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summary
                      .filter(s => roleFilter === 'all' || s.role === roleFilter)
                      .map(s => (
                        <div
                          key={s.staff_id}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-teal-100 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{s.full_name}</p>
                              <p className="text-[11px] text-slate-400 capitalize">{s.role}</p>
                            </div>
                            <p className={cn('text-lg font-bold shrink-0 ml-2', {
                              'text-emerald-600': s.attendance_percentage >= 90,
                              'text-amber-600':   s.attendance_percentage >= 75 && s.attendance_percentage < 90,
                              'text-red-600':     s.attendance_percentage < 75,
                            })}>
                              {s.attendance_percentage}%
                            </p>
                          </div>

                          {/* Mini stats row */}
                          <div className="flex gap-3 text-[11px]">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                              {s.total_present}P
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                              {s.total_absent}A
                            </span>
                            {s.total_half_day > 0 && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                {s.total_half_day}H
                              </span>
                            )}
                            {s.avg_shift_minutes != null && (
                              <span className="flex items-center gap-1 text-slate-400 ml-auto">
                                <Clock size={10} />
                                {formatShift(s.avg_shift_minutes)}
                              </span>
                            )}
                          </div>

                          {/* Attendance progress bar */}
                          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', {
                                'bg-emerald-500': s.attendance_percentage >= 90,
                                'bg-amber-500':   s.attendance_percentage >= 75 && s.attendance_percentage < 90,
                                'bg-red-500':     s.attendance_percentage < 75,
                              })}
                              style={{ width: `${Math.min(s.attendance_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </LabLayout>
  );
}