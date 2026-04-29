/**
 * Medical Data Normalization Utilities
 * Shared between OCR Scanning Workspace and Dashboard AI Analysis
 */

export const normalizeAnalysis = (payload = {}) => {
  const type = payload.type === 'Lab Report' || payload.type === 'Prescription' ? payload.type : 'Other';
  const patientInfo = payload.patientInfo || {};
  const results = payload.results || {};
  const labDetails = payload.labDetails || {};

  const parameters = Array.isArray(results.parameters)
    ? results.parameters.map((item) => ({
        name: item?.name || item?.parameter || 'Unknown Marker',
        parameter: item?.parameter || item?.name || 'Unknown Marker',
        value: item?.value ?? '--',
        unit: item?.unit || '',
        range: item?.range || '--',
        low: item?.low,
        high: item?.high,
        status: item?.status || item?.flag || 'Normal',
        flag: item?.flag || item?.status || 'Normal',
        explanation: {
          en: item?.explanation?.en || item?.insight || item?.education || 'No detailed insight provided by AI.',
          hi: item?.explanation?.hi || item?.insight || item?.education || 'कोई विस्तृत जानकारी उपलब्ध नहीं है।',
        },
        insight: item?.insight || '',
        education: item?.education || '',
        recommendation: item?.recommendation || '',
        creativeSolution: item?.creativeSolution || '',
        suggestedSpecialist: item?.suggestedSpecialist || '',
        suggestedMedicine: item?.suggestedMedicine || ''
      }))
    : [];

  const medicines = Array.isArray(results.medicines)
    ? results.medicines.map((item) => ({
        name: item?.name || 'Unknown Medicine',
        dosage: item?.dosage || '--',
        frequency: Array.isArray(item?.frequency) ? item.frequency : [],
        duration: item?.duration || '--',
        purpose: item?.purpose || 'General use',
        note: item?.note || ''
      }))
    : [];

  return {
    ...payload,
    type,
    labDetails: {
      name: labDetails.name || 'Sunrise Diagnostic Centre',
      address: labDetails.address || 'Kolkata, West Bengal',
      contact: labDetails.contact || '+91 00000 00000',
    },
    patientInfo: {
      name: patientInfo.name || 'Valued Patient',
      age: patientInfo.age || '--',
      gender: patientInfo.gender || '--',
      date: patientInfo.date || patientInfo.testDate || new Date().toLocaleDateString(),
      testDate: patientInfo.date || patientInfo.testDate || new Date().toLocaleDateString(),
      doctor: patientInfo.doctor || patientInfo.doctorName || '',
      doctorName: patientInfo.doctor || patientInfo.doctorName || '',
    },
    results: parameters,
    rawResults: {
      parameters,
      medicines,
    },
    analysis: {
      riskLevel: payload.riskLevel || 'Medium',
      summary: {
        en: payload.summary || payload.comprehensiveReport || 'Analysis complete.',
        hi: payload.summary || payload.comprehensiveReport || 'विश्लेषण पूर्ण हुआ।',
      },
      detectedIssues: Array.isArray(payload.detectedIssues) ? payload.detectedIssues : (parameters.filter(p => normalizeStatus(p.status) === 'Abnormal').map(p => p.parameter)),
      abnormalHighlights: Array.isArray(payload.abnormalHighlights) ? payload.abnormalHighlights : (parameters.filter(p => normalizeStatus(p.status) === 'Abnormal').map(p => `${p.parameter}: ${p.value} ${p.unit}`)),
      nextSteps: {
        diet: Array.isArray(payload.nextSteps?.diet) ? payload.nextSteps.diet : (Array.isArray(payload.advice) ? payload.advice.slice(0, 2) : ['Follow a balanced diet.']),
        lifestyle: Array.isArray(payload.nextSteps?.lifestyle) ? payload.nextSteps.lifestyle : (Array.isArray(payload.advice) ? payload.advice.slice(2, 4) : ['Regular exercise and rest.']),
      },
      medicineReferences: medicines.map(m => ({
        name: m.name,
        purpose: m.purpose,
        note: m.dosage + (m.duration ? ` • ${m.duration}` : '')
      }))
    },
    quality: {
      extractionMode: payload.quality?.extractionMode || 'multistage-ocr',
      analysisSpeed: payload.quality?.analysisSpeed || 'fast',
      coveragePercent: Number(payload.quality?.coveragePercent || 0),
    },
  };
};

export const isAiCapacityError = (error) => {
  const status = Number(error?.response?.status || 0);
  const apiCode = String(error?.response?.data?.code || '').toUpperCase();
  const msg = String(error?.response?.data?.error || error?.message || '').toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    apiCode === 'AI_QUOTA_EXCEEDED' ||
    apiCode === 'AI_BUSY' ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('high load')
  );
};

export const buildAiCapacityFallbackPayload = ({ retryAfterSec = 0 } = {}) => {
  const retryText = Number.isFinite(Number(retryAfterSec)) && Number(retryAfterSec) > 0
    ? `Please retry in about ${Math.ceil(Number(retryAfterSec))} seconds.`
    : 'Please retry shortly.';

  return {
    type: 'Other',
    labDetails: {
      name: 'LabIntel Fallback Mode',
      address: '',
      contact: '',
    },
    patientInfo: {
      name: '',
      age: '',
      gender: '',
      date: new Date().toLocaleDateString(),
      doctor: '',
    },
    results: {
      parameters: [],
      medicines: [],
    },
    summary: `AI service is temporarily capacity-limited. ${retryText}`,
    comprehensiveReport:
      'This is a temporary fallback report generated because the live AI provider is currently over quota or under heavy load.',
    advice: [
      'Retry after the cooldown window for full OCR and analysis.',
      'If you control backend keys, add a secondary AI key for failover.',
      'Do not use this temporary fallback as final clinical interpretation.',
    ],
    riskLevel: 'Medium',
    quality: {
      extractionMode: 'quota-fallback',
      analysisSpeed: 'fallback',
      coveragePercent: 0,
    },
  };
};

export const normalizeStatus = (status = '') => {
  const value = String(status).toLowerCase();
  if (value.includes('high') || value.includes('low') || value.includes('critical') || value.includes('abnormal')) {
    return 'Abnormal';
  }
  if (value.includes('border')) {
    return 'Borderline';
  }
  return 'Normal';
};
