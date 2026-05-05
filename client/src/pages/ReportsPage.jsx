import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  Brain,
  CalendarClock,
  ClipboardCheck,
  FlaskConical,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LabResultRow from '../components/LabResultRow';
import StatusBadge from '../components/StatusBadge';
import SummaryMetricCard from '../components/SummaryMetricCard';
import { reportService } from '../services/reportService';

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        const sampleReport = await reportService.getSampleReport();

        if (isMounted) {
          setReport(sampleReport);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load the sample report. Start the backend on port 5000 and try again.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-[32px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_60px_rgba(16,38,31,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">LabIntel Client</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Loading sample report</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Fetching lab data and AI interpretation from the Express backend.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-xl rounded-[32px] border border-rose-200 bg-white/90 p-8 shadow-[0_24px_60px_rgba(16,38,31,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-500">Connection issue</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Frontend is ready, backend is not reachable.</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const abnormalResults = report.results.filter((result) => result.status !== 'normal');

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(204,231,220,0.95),_transparent_35%),linear-gradient(135deg,#f5f8f6_0%,#f8faf9_42%,#edf4f1_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-[36px] border border-white/80 bg-white/75 p-8 shadow-[0_26px_80px_rgba(16,38,31,0.08)] backdrop-blur"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Client to server demo</p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  AI-assisted lab reporting with a clean React and Express split.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                  This sample page reads a report from the backend, shows structured laboratory values, and surfaces
                  AI-generated clinical guidance in a reusable UI shell.
                </p>
              </div>
              <StatusBadge value={report.status} />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryMetricCard
                icon={UserRound}
                label="Patient"
                value={report.patient.name}
                helper={`${report.patient.gender}, age ${report.patient.age}`}
              />
              <SummaryMetricCard
                icon={FlaskConical}
                label="Panel"
                value={report.panelName}
                helper={`${report.results.length} markers tested`}
              />
              <SummaryMetricCard
                icon={ClipboardCheck}
                label="Reviewed By"
                value={report.overview.reviewedBy}
                helper={`${report.overview.abnormalMarkers} markers need attention`}
              />
              <SummaryMetricCard
                icon={CalendarClock}
                label="Collected"
                value={formatDateTime(report.collectedAt)}
                helper={`${report.overview.turnaroundHours}h turnaround`}
              />
            </div>

            <div className="mt-8 rounded-[32px] bg-[#103c35] p-6 text-white shadow-[0_24px_60px_rgba(16,60,53,0.24)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b7dbcf]">AI Headline</p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight">{report.aiAnalysis.headline}</h2>
                </div>
                <StatusBadge value={report.aiAnalysis.riskLevel} />
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#d8ebe4]">{report.aiAnalysis.summary}</p>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <section className="rounded-[32px] border border-white/80 bg-[#f8f5ee] p-7 shadow-[0_24px_60px_rgba(16,38,31,0.08)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#14453d] shadow-sm">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Lab Snapshot</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">{report.lab.name}</h2>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                <p className="flex items-start gap-3">
                  <MapPin size={16} className="mt-1 shrink-0 text-[#14453d]" />
                  <span>{report.lab.location}</span>
                </p>
                <p className="flex items-start gap-3">
                  <Activity size={16} className="mt-1 shrink-0 text-[#14453d]" />
                  <span>{report.clinicianNote}</span>
                </p>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/80 bg-white/85 p-7 shadow-[0_24px_60px_rgba(16,38,31,0.08)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4f0eb] text-[#14453d]">
                  <Brain size={22} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Recommendations</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">What the AI suggests next</h2>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {report.aiAnalysis.recommendations.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </motion.aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-[36px] border border-white/80 bg-white/80 p-8 shadow-[0_26px_80px_rgba(16,38,31,0.08)] backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Lab Results</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Structured diagnostic markers</h2>
              </div>
              <p className="text-sm text-slate-500">Generated at {formatDateTime(report.generatedAt)}</p>
            </div>

            <div className="mt-6 space-y-4">
              {report.results.map((result) => (
                <LabResultRow key={result.name} result={result} />
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="rounded-[32px] border border-white/80 bg-white/85 p-7 shadow-[0_24px_60px_rgba(16,38,31,0.08)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4e4] text-[#ab6a16]">
                  <Sparkles size={22} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Flagged Markers</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Signals worth reviewing</h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {abnormalResults.map((result) => (
                  <div key={result.name} className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-slate-900">{result.name}</p>
                      <StatusBadge value={result.status} />
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{result.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/80 bg-[#edf5f1] p-7 shadow-[0_24px_60px_rgba(16,38,31,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Follow-up</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">Suggested next actions</h2>
              <div className="mt-6 space-y-3">
                {report.aiAnalysis.nextSteps.map((step) => (
                  <div key={step} className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-slate-600 shadow-sm">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
