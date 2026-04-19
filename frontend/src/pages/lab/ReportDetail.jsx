import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { LabLayout } from '../../components/lab/LabLayout';
import { Card, Button, Skeleton, EmptyState, FlagBadge, Modal } from '../../components/common';
import { formatDate } from '../../utils/formatDate';
import { usePermission } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useLabPath } from '../../hooks/useLabPath';
import { ArrowLeft, Download, Share2, Brain, RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';

/* ── Status stepper ───────────────────────────────────────────────────── */
function StatusStepper({ status }) {
  const steps = [
    { key: 'draft',     label: 'Draft' },
    { key: 'in_review', label: 'In Review' },
    { key: 'released',  label: 'Released' },
  ];
  const idx = steps.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${i <= idx ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {i < idx ? <CheckCircle size={12} /> : i === idx ? <AlertCircle size={12} /> : <span className="w-3 h-3 rounded-full border-2 border-current" />}
            {step.label}
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 w-8 ${i < idx ? 'bg-teal-600' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const [releaseModal, setReleaseModal] = useState(false);
  const { canDo } = usePermission();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const lp = useLabPath();

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportService.getById(id),
    staleTime: 1000 * 60,
    refetchInterval: (query) => {
      const report = query.state.data?.data;
      if (report?.report_insights) return false;
      return 5000; // Poll every 5s while insight isn't ready
    },
  });

  const report  = data?.data;
  const patient = report?.patients;
  const lab     = report?.labs;
  const panel   = report?.test_panels;
  const insight = report?.report_insights;
  const isFemale = patient?.gender === 'female';

  const nextStatus = { draft: 'in_review', in_review: 'released' }[report?.status];
  const canAdvance = nextStatus && (nextStatus === 'released' ? canDo('releaseReport') : canDo('editTestValues'));

  const statusMutation = useMutation({
    mutationFn: (s) => reportService.updateStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report', id] });
      setReleaseModal(false);
      addToast(`Report moved to ${nextStatus?.replace('_', ' ')}`, 'success');
    },
    onError: () => addToast('Status update failed.', 'error'),
  });

  const insightMutation = useMutation({
    mutationFn: () => reportService.regenerateInsights(id),
    onSuccess: () => addToast('Insight generation started…', 'info'),
  });

  const handleDownload = async () => {
    try {
      const r = await reportService.getDownloadUrl(id);
      window.open(r.url, '_blank');
    } catch { addToast('Download failed.', 'error'); }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/reports/share/${report?.share_token}`;
    navigator.clipboard.writeText(url);
    addToast('Share link copied!', 'success');
  };

  if (isLoading) return <LabLayout><div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-64" /></div></LabLayout>;
  if (!report) return <LabLayout><EmptyState icon="❌" title="Report not found" /></LabLayout>;

  return (
    <LabLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Back */}
        <Link to={lp('reports')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> All Reports
        </Link>

        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{panel?.name}</h1>
              <p className="text-slate-500 text-sm">{patient?.full_name} · {formatDate(report.collected_at)}</p>
            </div>
            <StatusStepper status={report.status} />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {canDo('downloadPDF') && report.pdf_url && (
              <Button size="sm" variant="secondary" onClick={handleDownload}><Download size={14} />Download PDF</Button>
            )}
            {report.share_token && (
              <Button size="sm" variant="ghost" onClick={copyShareLink}><Copy size={14} />Copy Share Link</Button>
            )}
            {canDo('editTestValues') && !insight && (
              <Button size="sm" variant="ghost" onClick={() => insightMutation.mutate()} isLoading={insightMutation.isPending}>
                <Brain size={14} />Regenerate AI
              </Button>
            )}
            {nextStatus && canAdvance && (
              <Button
                size="sm"
                variant={nextStatus === 'released' ? 'primary' : 'outline'}
                onClick={() => nextStatus === 'released' ? setReleaseModal(true) : statusMutation.mutate(nextStatus)}
                isLoading={statusMutation.isPending}
              >
                {nextStatus === 'in_review' ? '→ Send for Review' : '✓ Release Report'}
              </Button>
            )}
          </div>
        </Card>

        {/* Test values */}
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Test Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parameter</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Result</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(report.test_values || []).map((tv, i) => {
                  const p = tv.test_parameters;
                  const refMin = isFemale ? p?.ref_min_female : p?.ref_min_male;
                  const refMax = isFemale ? p?.ref_max_female : p?.ref_max_male;
                  return (
                    <tr key={i} className={tv.flag !== 'normal' ? 'bg-red-50/50' : ''}>
                      <td className="px-5 py-3 font-medium text-slate-800">{p?.name}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">{tv.value}</td>
                      <td className="px-3 py-3 text-center text-slate-500">{p?.unit || '—'}</td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        {refMin != null && refMax != null ? `${refMin}–${refMax}` : '—'}
                      </td>
                      <td className="px-3 py-3 text-center"><FlagBadge flag={tv.flag} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Insight */}
        <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} className="text-teal-600" />
            <h2 className="text-sm font-bold text-teal-800 uppercase tracking-wide">AI Health Summary</h2>
            {!insight && <RefreshCw size={14} className="text-teal-500 animate-spin" />}
          </div>
          {!insight ? (
            <p className="text-sm text-teal-700 italic">Generating AI insights… This may take a moment.</p>
          ) : (
            <>
              <p className="text-sm text-teal-900 mb-3">{insight.summary}</p>
              {insight.findings?.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {insight.findings.map((f, i) => <li key={i} className="text-sm text-teal-800">• {f}</li>)}
                </ul>
              )}
              <div className="bg-white/60 rounded-lg p-3 text-sm italic text-teal-800 border border-teal-200">
                💡 {insight.recommendation}
              </div>
            </>
          )}
        </div>

        {/* Release confirmation modal */}
        <Modal open={releaseModal} onClose={() => setReleaseModal(false)} title="Release Report">
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Releasing this report will send an <strong>SMS notification</strong> to the patient and make it visible on their portal.
            </p>
            <p className="text-sm text-slate-500">Continue?</p>
            <div className="flex gap-2">
              <Button onClick={() => statusMutation.mutate('released')} isLoading={statusMutation.isPending} className="flex-1">
                ✓ Yes, Release Report
              </Button>
              <Button variant="secondary" onClick={() => setReleaseModal(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      </div>
    </LabLayout>
  );
}
