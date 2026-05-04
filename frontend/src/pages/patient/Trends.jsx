import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../../services/patientService';
import { PatientLayout } from '../../components/patient/PatientLayout';
import { Card, Skeleton, EmptyState } from '../../components/common';
import { formatDate } from '../../utils/formatDate';
import { getFlagConfig } from '../../utils/flagColor';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, ReferenceArea, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const LAB_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#d97706'];

function TrendAnnotation({ data }) {
  if (!data || data.length < 2) return null;
  const flags = data.map((d) => d.flag);
  const lastN = flags.slice(-3);
  const allAbnormal = lastN.every((f) => f !== 'normal');
  const allHigh = lastN.every((f) => f === 'high' || f === 'critical_high');
  const allLow  = lastN.every((f) => f === 'low'  || f === 'critical_low');
  const values  = data.map((d) => parseFloat(d.value));
  const isRising = values.at(-1) > values.at(-3);
  const isFalling = values.at(-1) < values.at(-3);

  if (!allAbnormal) {
    return <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg mt-2">✓ Values appear to be within normal range.</p>;
  }
  const direction = allHigh ? 'elevated' : allLow ? 'low' : 'abnormal';
  const trend = isRising ? '📈' : isFalling ? '📉' : '➡️';
  return (
    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg mt-2">
      {trend} This parameter has been consistently {direction} across {lastN.length} recent reports. Consult your doctor.
    </p>
  );
}

export default function PatientTrends() {
  const [selectedParam, setSelectedParam] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['patient-trends'],
    queryFn: patientService.portal.getMyTrends,
    staleTime: 1000 * 60 * 5,
  });

  const groups = useMemo(() => {
    const raw = data?.data || [];
    return raw.filter((g) => g.data?.length >= 2);
  }, [data]);

  const selected = useMemo(() => {
    if (!groups.length) return null;
    return groups.find((g) => g.parameter?.id === selectedParam) || groups[0];
  }, [groups, selectedParam]);

  const allLabs = useMemo(() => {
    if (!selected) return [];
    return [...new Set(selected.data.map((d) => d.lab))].filter(Boolean);
  }, [selected]);

  const isFemale = false; // could read from authStore user.gender
  const refMin = selected?.parameter?.ref_min_female ?? selected?.parameter?.ref_min_male;
  const refMax = selected?.parameter?.ref_max_female ?? selected?.parameter?.ref_max_male;

  const chartData = useMemo(() => (
    (selected?.data || []).map((d, i) => ({
      date: formatDate(d.date, 'dd MMM'),
      value: parseFloat(d.value),
      flag: d.flag,
      fill: getFlagConfig(d.flag).barColor,
    }))
  ), [selected]);

  return (
    <PatientLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Health Trends</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your biomarkers over time</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : groups.length === 0 ? (
          <EmptyState icon="📈" title="No trend data yet" description="You need at least 2 reports with the same parameter to see trends." />
        ) : (
          <>
            {/* Parameter selector */}
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  key={g.parameter?.id}
                  onClick={() => setSelectedParam(g.parameter?.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    (selected?.parameter?.id === g.parameter?.id)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {g.parameter?.name}
                </button>
              ))}
            </div>

            {/* Chart */}
            {selected && (
              <Card className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-800">{selected.parameter?.name}</h2>
                    <p className="text-xs text-slate-500">{selected.parameter?.unit} · {selected.data.length} data points</p>
                  </div>
                  {refMin != null && refMax != null && (
                    <div className="text-xs text-slate-500 text-right">
                      Reference: {refMin}–{refMax} {selected.parameter?.unit}
                    </div>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    {refMin != null && refMax != null && (
                      <ReferenceArea y1={refMin} y2={refMax} fill="#d1fae5" fillOpacity={0.5} />
                    )}
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v, n) => [v, selected.parameter?.name]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={({ cx, cy, payload }) => (
                        <circle key={`dot-${cx}`} cx={cx} cy={cy} r={5} fill={payload.fill} stroke="white" strokeWidth={2} />
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <TrendAnnotation data={selected.data} />

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Low / High</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Critical</span>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </PatientLayout>
  );
}
