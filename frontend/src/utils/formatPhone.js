export const formatPhone = (phone) => {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
};

export const maskPhone = (phone) => {
  if (!phone) return '—';
  // +919876543210 → +91 98765 ****0
  const f = formatPhone(phone);
  return f.slice(0, -4) + '****';
};
