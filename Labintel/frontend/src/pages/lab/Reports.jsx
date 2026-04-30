import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Skeleton, EmptyState, StatusBadge, Badge } from '../../components/common';
import { formatDate, timeAgo } from '../../utils/formatDate';
import { usePermission } from '../../hooks/useAuth';
import { useLabPath } from '../../hooks/useLabPath';
import { Search, Filter, Plus, Download, ChevronRight, X } from 'lucide-react';

const STATUS_OPTS = ['', 'draft', 'in_review', 'released'];

export default function Reports() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const { canDo } = usePermission();
  const lp = useLabPath();

  const { data, isLoading } = useQuery({
    queryKey: ['reports', { search, status, page }],
    queryFn: () => reportService.getAll({ search, status, page, limit: 20 }),
    staleTime: 1000 * 30,
    keepPreviousData: true,
  });

  const reports  = data?.data || [];
  const total    = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleDownload = async (id) => {
    try {
      const r = await reportService.getDownloadUrl(id);
      window.open(r.url, '_blank');
    } catch { /* silent */ }
  };

  return (
    <LabLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">{total} total reports</p>
        </div>
        {canDo('createReport') && (
          <Link to={lp('reports/new')}>
            <Button><Plus size={15} />New Report</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search patient name…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_OPTS.map(s => (
            <button key={s || 'all'}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${status === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
        ) : reports.length === 0 ? (
          <EmptyState icon="📋" title="No reports found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Panel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Collected</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">By</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{r.patients?.full_name || '—'}</p>
                        <p className="text-xs text-slate-400">{timeAgo(r.created_at)}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 hidden md:table-cell">{r.test_panels?.name}</td>
                      <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell text-xs">{formatDate(r.collected_at)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell text-xs">{r.lab_staff?.full_name}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          {r.pdf_url && (
                            <button onClick={() => handleDownload(r.id)} className="text-slate-400 hover:text-teal-600 transition-colors">
                              <Download size={14} />
                            </button>
                          )}
                          <Link to={lp(`reports/${r.id}`)} className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
                            View <ChevronRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </LabLayout>
  );
}
