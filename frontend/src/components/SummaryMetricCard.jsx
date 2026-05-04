function SummaryMetricCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,38,31,0.08)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e4f0eb] text-[#14453d]">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <p
        className="mt-4 text-2xl font-black tracking-tight text-slate-900"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p> : null}
    </article>
  );
}

export default SummaryMetricCard;
