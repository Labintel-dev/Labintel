import { useState } from 'react';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Select } from '../../components/common';
import { Users, Clock, CalendarX, Activity, CalendarDays, Search, Filter } from 'lucide-react';

// Mocked Data
const mockStaffData = [
  { id: 1, name: 'Arjun Sharma', role: 'Manager', dept: 'Administration', status: 'present', entryTime: '2026-04-19T08:00:00', exitTime: null, presentDays: 18, absentDays: 0, attendance: 100 },
  { id: 2, name: 'Priya Patel', role: 'Receptionist', dept: 'Front Desk', status: 'present', entryTime: '2026-04-19T08:15:00', exitTime: null, presentDays: 17, absentDays: 1, attendance: 94 },
  { id: 3, name: 'Rahul Gupta', role: 'Technician', dept: 'Laboratory', status: 'absent', entryTime: null, exitTime: null, presentDays: 12, absentDays: 6, attendance: 66 },
  { id: 4, name: 'Sunita Mehta', role: 'Manager', dept: 'Administration', status: 'present', entryTime: '2026-04-19T07:45:00', exitTime: '2026-04-19T14:30:00', presentDays: 15, absentDays: 3, attendance: 83 },
  { id: 5, name: 'Vikram Singh', role: 'Technician', dept: 'Laboratory', status: 'on_leave', entryTime: null, exitTime: null, presentDays: 10, absentDays: 8, attendance: 55 },
  { id: 6, name: 'Ananya Bose', role: 'Technician', dept: 'Laboratory', status: 'present', entryTime: '2026-04-19T09:00:00', exitTime: null, presentDays: 16, absentDays: 2, attendance: 88 },
];

const timeFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

const roleFilterOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'manager', label: 'Manager' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'technician', label: 'Technician' },
];

export default function StaffTracking() {
  const [timeFilter, setTimeFilter] = useState('today');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredStaff = mockStaffData.filter(s => roleFilter === 'all' || s.role.toLowerCase() === roleFilter);
  
  // Calculate aggregate stats
  const presentCount = mockStaffData.filter(s => s.status === 'present').length;
  const absentCount = mockStaffData.filter(s => s.status === 'absent' || s.status === 'on_leave').length;
  
  // Calculate average shift duration roughly (using mock logic)
  const avgShiftDuration = "8h 15m"; // Static mock for aesthetics
  
  // Find most absent
  const mostAbsentStaff = [...mockStaffData].sort((a,b) => b.absentDays - a.absentDays)[0];

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getShiftDuration = (entry, exit) => {
    if (!entry) return '—';
    const start = new Date(entry);
    const end = exit ? new Date(exit) : new Date();
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  const StatusBadge = ({ status }) => {
    if (status === 'present') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Present</span>;
    if (status === 'absent') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Absent</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>On Leave</span>;
  };

  return (
    <LabLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Staff Tracking</h1>
        <p className="text-sm text-slate-500">Live attendance monitoring and absence tracking</p>
      </div>

      <div className="space-y-6">
        {/* 4. Summary Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-emerald-500">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff Present</p>
              <p className="text-2xl font-bold text-slate-800">{presentCount}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-red-500">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <CalendarX size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff Absent</p>
              <p className="text-2xl font-bold text-slate-800">{absentCount}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-blue-500">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Shift Duration</p>
              <p className="text-2xl font-bold text-slate-800">{avgShiftDuration}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-amber-500">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Most Absent</p>
              <p className="text-lg font-bold text-slate-800 truncate" title={mostAbsentStaff?.name}>{mostAbsentStaff?.name || '—'}</p>
              <p className="text-xs text-slate-500">{mostAbsentStaff?.absentDays} days away</p>
            </div>
          </Card>
        </div>

        {/* 3. Time Filter Controls */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Filter Records</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-48">
                <Select
                  options={timeFilterOptions}
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  options={roleFilterOptions}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                />
              </div>
              <Button variant="secondary" className="shrink-0"><Search size={16} /> Apply</Button>
            </div>
          </div>
        </Card>

        {/* Live Attendance and Tracker Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* 1. Live Attendance Panel - Table */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <CalendarDays size={18} className="text-teal-600" />
                <h2 className="font-semibold text-slate-800">Live Attendance Panel</h2>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-3 rounded-tl-xl">Staff Member</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Entry Time</th>
                      <th className="px-4 py-3">Exit Time</th>
                      <th className="px-5 py-3 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map(staff => (
                      <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">{staff.name}</p>
                          <p className="text-xs text-slate-500">{staff.role}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={staff.status} /></td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{formatTime(staff.entryTime)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {staff.exitTime ? formatTime(staff.exitTime) : (
                            staff.status === 'present' ? <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded backdrop-blur-sm">Still In</span> : '—'
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">
                          {getShiftDuration(staff.entryTime, staff.exitTime)}
                        </td>
                      </tr>
                    ))}
                    {filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No records found for the applied filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* 2. Absence Tracker Summary */}
          <div>
            <Card className="h-full flex flex-col">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Absence Tracker</h2>
                <p className="text-xs text-slate-500 mt-1">Monthly performance summary</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2">
                  {mockStaffData.map(staff => (
                    <div key={staff.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:border-teal-100 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{staff.name}</p>
                        <div className="flex gap-3 text-xs mt-1 text-slate-500">
                          <span title="Total Days Present" className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>{staff.presentDays}P</span>
                          <span title="Total Days Absent" className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>{staff.absentDays}A</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-bold ${staff.attendance >= 90 ? 'text-emerald-600' : staff.attendance >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {staff.attendance}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </LabLayout>
  );
}
