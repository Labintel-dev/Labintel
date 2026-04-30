const toneMap = {
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  low: 'bg-amber-100 text-amber-700 border-amber-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  elevated: 'bg-rose-100 text-rose-700 border-rose-200',
  attention_needed: 'bg-rose-100 text-rose-700 border-rose-200',
};

const formatValue = (value) => {
  if (!value) return 'Unknown';
  return value.replace(/_/g, ' ');
};

function StatusBadge({ value }) {
  const normalizedValue = String(value || '').toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
        toneMap[normalizedValue] || 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {formatValue(normalizedValue)}
    </span>
  );
}

export default StatusBadge;
