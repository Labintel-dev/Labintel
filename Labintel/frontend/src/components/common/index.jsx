import React from 'react';
import { cn } from '../../utils/cn';

// ── Button ────────────────────────────────────────────────────────────────
export function Button({ children, className, variant = 'primary', size = 'md', isLoading, disabled, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-400',
    ghost:     'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline:   'border border-teal-600 text-teal-600 hover:bg-teal-50 focus:ring-teal-500',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || isLoading} {...props}>
      {isLoading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
export const Input = React.forwardRef(({ className, label, error, prefix, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-slate-500 text-sm font-medium">{prefix}</span>}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
          'placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed',
          prefix ? 'pl-10' : '',
          error ? 'border-red-400 focus:ring-red-400' : '',
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Input.displayName = 'Input';

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default:   'bg-slate-100 text-slate-700 border-slate-200',
    success:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning:   'bg-amber-50 text-amber-700 border-amber-200',
    error:     'bg-red-50 text-red-700 border-red-200',
    info:      'bg-blue-50 text-blue-700 border-blue-200',
    teal:      'bg-teal-50 text-teal-700 border-teal-200',
    purple:    'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={cn('inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border', variants[variant], className)}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, className, ...props }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-100 shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={cn('border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin', sizes[size], className)} />
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, className }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in', className)}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────
export const Select = React.forwardRef(({ className, label, error, options = [], ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all appearance-none',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
        error ? 'border-red-400' : '',
        className
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Select.displayName = 'Select';

// ── Textarea ──────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef(({ className, label, error, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all resize-none',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
        error ? 'border-red-400' : '',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ── KPI Card ──────────────────────────────────────────────────────────────
export function KPICard({ title, value, sub, icon, color = 'teal', isLoading }) {
  const colors = {
    teal:   'from-teal-500 to-teal-600',
    blue:   'from-blue-500 to-blue-600',
    amber:  'from-amber-500 to-amber-600',
    red:    'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };
  return (
    <Card className="p-5 overflow-hidden relative">
      <div className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', colors[color])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          {isLoading
            ? <Skeleton className="h-8 w-24 mt-2" />
            : <p className="text-3xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
          }
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-xl bg-gradient-to-br text-white shadow-sm', colors[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    draft:     { label: 'Draft',      variant: 'default' },
    in_review: { label: 'In Review',  variant: 'warning' },
    released:  { label: 'Released',   variant: 'success' },
  };
  const cfg = map[status] || { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon || '📭'}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────
import { useUIStore } from '../../store/uiStore';
export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-700', warning: 'bg-amber-600' };
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg animate-slide-in', colors[t.type] || colors.info)}>
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

// ── FlagBadge ─────────────────────────────────────────────────────────────
import { getFlagConfig } from '../../utils/flagColor';
export function FlagBadge({ flag }) {
  const cfg = getFlagConfig(flag || 'normal');
  return (
    <span className={cn('inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border', cfg.color)}>
      {cfg.label}
    </span>
  );
}
