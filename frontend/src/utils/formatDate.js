import { format, formatDistanceToNow, differenceInYears, parseISO } from 'date-fns';

export const formatDate = (dateStr, fmt = 'dd MMM yyyy') => {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), fmt); } catch { return '—'; }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'dd MMM yyyy, h:mm a'); } catch { return '—'; }
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }); } catch { return '—'; }
};

export const calcAge = (dob) => {
  if (!dob) return null;
  try { return differenceInYears(new Date(), parseISO(dob)); } catch { return null; }
};
