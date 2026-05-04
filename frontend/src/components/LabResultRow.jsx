import StatusBadge from './StatusBadge';

function LabResultRow({ result }) {
  return (
    <article className="grid gap-3 rounded-[28px] border border-white/80 bg-white/95 p-4 shadow-[0_16px_48px_rgba(16,38,31,0.06)] md:grid-cols-[1.3fr_0.9fr_0.9fr_auto] md:items-center">
      <div>
        <p className="text-base font-bold text-slate-900">{result.name}</p>
        <p className="mt-1 text-sm text-slate-500">{result.interpretation}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Value</p>
        <p className="mt-2 text-base font-bold text-slate-900">
          {result.value} <span className="text-sm font-medium text-slate-500">{result.unit}</span>
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reference</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">{result.referenceRange}</p>
      </div>
      <div className="md:justify-self-end">
        <StatusBadge value={result.status} />
      </div>
    </article>
  );
}

export default LabResultRow;
