const MB = 1024 * 1024;

export function chooseAnalysisSpeed({ mimeType = '', fileSizeBytes = 0, fileName = '' } = {}) {
  const normalizedMime = String(mimeType || '').toLowerCase();
  const normalizedName = String(fileName || '').toLowerCase();
  const size = Number(fileSizeBytes) || 0;

  const isPdf = normalizedMime.includes('pdf') || normalizedName.endsWith('.pdf');

  if (size >= 5 * MB) return 'thorough';
  if (isPdf && size >= 2 * MB) return 'thorough';
  if (size >= 2.5 * MB) return 'balanced';
  if (isPdf && size >= 0.8 * MB) return 'balanced';

  return 'fast';
}

