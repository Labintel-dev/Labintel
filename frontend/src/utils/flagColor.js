export const flagConfig = {
  normal:        { label: 'Normal',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200',   dot: 'bg-emerald-500', barColor: '#10b981' },
  low:           { label: 'Low',      color: 'text-amber-700  bg-amber-50  border-amber-200',       dot: 'bg-amber-500',   barColor: '#f59e0b' },
  high:          { label: 'High',     color: 'text-orange-700 bg-orange-50 border-orange-200',      dot: 'bg-orange-500',  barColor: '#f97316' },
  critical_low:  { label: 'Crit. Low',color: 'text-red-700   bg-red-50   border-red-300',          dot: 'bg-red-600',     barColor: '#ef4444' },
  critical_high: { label: 'Crit. High',color:'text-red-700   bg-red-50   border-red-300',          dot: 'bg-red-600',     barColor: '#ef4444' },
};

export const getFlagConfig = (flag) => flagConfig[flag] || flagConfig.normal;

export const isCritical = (flag) => flag === 'critical_low' || flag === 'critical_high';
export const isAbnormal = (flag) => flag !== 'normal';
