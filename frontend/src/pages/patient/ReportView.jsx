import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../../services/patientService';
import { reportService } from '../../services/reportService';
import { PatientLayout } from '../../components/patient/PatientLayout';
import { Card, Button, Skeleton, FlagBadge, Badge } from '../../components/common';
import { formatDate, formatDateTime, calcAge } from '../../utils/formatDate';
import { getFlagConfig } from '../../utils/flagColor';
import { useUIStore } from '../../store/uiStore';
import { usePatientAuthStore } from '../../store/authStore';
import { Download, FlaskConical, Brain, ArrowLeft, AlertTriangle } from 'lucide-react';

/* ── Value bar indicator ─────────────────────────────────────────────── */
function ValueBar({ value, refMin, refMax, flag }) {
  if (!refMin || !refMax) return null;
  const range = refMax - refMin;
  const buffer = range * 0.3;
  const total = range + 2 * buffer;
  const clamp = (v) => Math.max(0, Math.min(100, ((v - (refMin - buffer)) / total) * 100));
  const pos = clamp(parseFloat(value));
  const { barColor } = getFlagConfig(flag);

  return (
    <div className="relative h-2 bg-slate-100 rounded-full w-full mt-1">
      <div className="absolute inset-y-0 left-[23.1%] right-[23.1%] bg-emerald-100 rounded-full" />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-sm transition-all"
        style={{ left: `calc(${pos}% - 6px)`, background: barColor }}
      />
    </div>
  );
}

export default function PatientReportView() {
  const { id } = useParams();
  const { addToast } = useUIStore();
  const user = usePatientAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['patient-report', id],
    queryFn: () => patientService.portal.getMyReport(id),
    staleTime: 1000 * 60 * 5,
  });

  const report = data?.data;
  const patient = report?.patients;
  const lab = report?.labs;
  const panel = report?.test_panels;
  const patientCode = report?.lab_patient?.lab_patient_code;
  const insight = report?.report_insights;
  const accentColor = lab?.primary_color || '#0d9488';
  const isFemale = patient?.gender === 'female';

  const handleDownload = async () => {
    try {
      const result = await reportService.getDownloadUrl(id);
      const a = document.createElement('a');
      a.href = result.url;
      a.target = '_blank';
      a.download = `LabReport-${id}.pdf`;
      a.click();
    } catch {
      addToast('Could not generate download link.', 'error');
    }
  };

  if (isLoading) return (
    <PatientLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </PatientLayout>
  );

  if (!report) return (
    <PatientLayout>
      <div className="text-center py-20">
        <p className="text-slate-500">Report not found.</p>
        <Link to="/reports" className="text-teal-600 mt-2 inline-block underline text-sm">Back to reports</Link>
      </div>
    </PatientLayout>
  );

  return (
    <PatientLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Back */}
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> Back to reports
        </Link>

        {/* Header card */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          <div className="h-2" style={{ background: accentColor }} />
          <div className="p-6 bg-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ background: accentColor }}>
                <FlaskConical size={24} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-800">{panel?.name}</h1>
                <p className="text-sm text-slate-500">{lab?.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                  {patientCode && <span>Patient No. {patientCode}</span>}
                  <span>🧪 Collected: {formatDate(report.collected_at)}</span>
                  <span>📋 Reported: {formatDate(report.reported_at)}</span>
                </div>
              </div>
              <Badge variant="success">Released</Badge>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download size={14} /> Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Test values table */}
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <FlaskConical size={16} className="text-teal-600" />
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
                  const isAbn = tv.flag && tv.flag !== 'normal';
                  return (
                    <tr key={i} className={isAbn ? 'bg-red-50/50' : ''}>
                      <td className="px-5 py-3 font-medium text-slate-800">{p?.name}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">{tv.value}</td>
                      <td className="px-3 py-3 text-center text-slate-500">{p?.unit || '—'}</td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        {refMin != null && refMax != null ? `${refMin}–${refMax}` : '—'}
                        <ValueBar value={tv.value} refMin={refMin} refMax={refMax} flag={tv.flag} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <FlagBadge flag={tv.flag} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 border-t border-slate-100 text-xs text-slate-400">
            L = Low · H = High · L* = Critically Low · H* = Critically High
          </div>
        </Card>

        {/* AI Insight panel */}
        {insight && (
          <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-teal-600" />
              <h2 className="text-sm font-bold text-teal-800 uppercase tracking-wide">AI Health Summary</h2>
              <span className="text-xs text-teal-500 ml-auto">Llama 4 · Not a medical diagnosis</span>
            </div>
            <p className="text-sm text-teal-900 mb-3">{insight.summary}</p>
            {insight.findings?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-bold text-teal-700 uppercase mb-1.5">Key Findings</p>
                <ul className="space-y-1">
                  {insight.findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-teal-800">
                      <span className="text-teal-600 mt-0.5">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-white/60 rounded-lg p-3 text-sm text-teal-800 italic border border-teal-200">
              💡 {insight.recommendation}
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
