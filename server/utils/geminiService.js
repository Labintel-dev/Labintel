<<<<<<< HEAD
const { GoogleGenAI } = require('@google/genai');

const VALID_REPORT_TYPES = new Set(['Lab Report', 'Prescription', 'Other']);
const VALID_RISK_LEVELS = new Set(['Low', 'Medium', 'High']);
const VALID_STATUSES = new Set(['Normal', 'Low', 'High', 'Critical', 'Abnormal', 'Borderline']);

function normalizeGeminiContents(contents) {
  // The raw REST API expects: { contents: [ { role: 'user', parts: [ { text: '...' }, { inline_data: { ... } } ] } ] }
  const parts = [];
  const items = Array.isArray(contents) ? contents : [contents];

  for (const item of items) {
    if (!item) continue;
    if (typeof item === 'string') {
      parts.push({ text: item });
    } else if (item.inlineData) {
      parts.push({
        inline_data: {
          mime_type: item.inlineData.mimeType || item.inlineData.mime_type,
          data: item.inlineData.data
        }
      });
    } else if (item.text) {
      parts.push({ text: item.text });
    } else if (typeof item === 'object') {
      parts.push(item);
    }
  }

  return [{ role: 'user', parts }];
}

function extractGeminiText(result) {
  if (!result) return '';
  if (typeof result.text === 'string') return result.text;
  if (typeof result.text === 'function') {
    const text = result.text();
    if (typeof text === 'string') return text;
  }
  const parts = result?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function normalizeChatHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .map((item) => {
      const role = item?.role === 'user' ? 'user' : 'model';
      const text = String(item?.content || item?.parts?.[0]?.text || '').trim();
      if (!text) return null;
      return {
        role,
        parts: [{ text }],
      };
    })
    .filter(Boolean);
}

const https = require('https');

function createGeminiModel(apiKey, modelName) {
  return {
    async generateContent(contents) {
      const payload = JSON.stringify({
        contents: normalizeGeminiContents(contents)
      });

      const tryEndpoint = (version) => new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
        const req = https.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (res.statusCode !== 200) {
                const errMsg = response.error?.message || response.error || data;
                return reject(new Error(`[HTTP ${res.statusCode}] ${errMsg}`));
              }
              const text = extractGeminiText(response);
              resolve({ response: { text: () => text } });
            } catch (e) {
              reject(new Error(`Failed to parse Gemini response: ${e.message}`));
            }
          });
        });
        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
      });

      try {
        // Try stable v1 first
        return await tryEndpoint('v1');
      } catch (err) {
        // Fallback to beta
        return await tryEndpoint('v1beta');
      }
    },
    startChat({ history = [] } = {}) {
      // Basic mock for chat if needed, though OCR uses generateContent
      return {
        async sendMessage(message) {
          return this.generateContent(message);
        }
      };
    }
  };
}

function resolveGeminiApiKeys() {
  const keys = [
    process.env.GOOGLE_GEMINI_API_KEY,
    process.env.GOOGLE_GEMINI_API_KEY_2,
    process.env.GOOGLE_GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY
  ].map(k => String(k || '').trim()).filter(k => k.startsWith('AIza'));
  return [...new Set(keys)]; // Return unique valid keys
}

function resolveGeminiApiKey() {
  const keys = resolveGeminiApiKeys();
  return keys[0] || '';
}

function resolveGeminiModel() {
  return process.env.GOOGLE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

const DEFAULT_GEMINI_MODEL = resolveGeminiModel();

// Groq/OCR Configuration
const OCR_EXTRACTION_PROMPT = `
You are a high-accuracy medical OCR engine.
Extract text from this medical document with maximum fidelity.

Rules:
1) Do not summarize.
2) Preserve original numbers, units, ranges, and medicine spellings exactly.
3) Return JSON only.
4) Include every visible line from top to bottom. Do not skip lines.
5) Include as many rows as visible. Do not skip biomarkers.
6) If uncertain, keep fields empty instead of guessing.

Return exactly this JSON object:
{
  "rawText": "full OCR text with line breaks",
  "detectedType": "Lab Report | Prescription | Other",
  "header": {
    "labName": "",
    "address": "",
    "contact": "",
    "patientName": "",
    "age": "",
    "gender": "",
    "date": "",
    "doctor": ""
  },
  "markers": [
    {
      "name": "",
      "value": "",
      "unit": "",
      "range": "",
      "lineEvidence": ""
    }
  ],
  "medicines": [
    {
      "name": "",
      "dosage": "",
      "frequency": ["Morning", "Afternoon", "Night"],
      "duration": "",
      "purpose": "",
      "lineEvidence": ""
    }
  ],
  "lines": [
    {
      "lineNumber": 1,
      "page": 1,
      "text": "exact OCR line text",
      "category": "header | marker | medicine | note | other"
    }
  ]
}
`;

const STRUCTURED_REPORT_PROMPT = `
You are a High-Precision Clinical Data Auditor.
Your mission: Transform raw OCR text into an EXHAUSTIVE structured medical report.

CRITICAL RULES (NO EXCEPTIONS):
1. MEDICAL DETECTIVE MODE: The OCR might miss labels like "Haemoglobin" or "Absolute". You MUST use the reference ranges to identify missing tests:
   - Range 13-17 = Haemoglobin
   - Range 4.5-5.5 = RBC Count
   - Range 4000-10000 = WBC Count
   - Range 2000-7000 = Absolute Neutrophils
   - Range 1000-3000 = Absolute Lymphocytes
   - Range 200-1000 = Absolute Monocytes
   - Range 20-500 = Absolute Eosinophils
2. ZERO NUMBER LEFT BEHIND: If you see a numeric value (e.g. 14.2, 4,092), you MUST include it in the report. Use the "Detective" method above to name it.
3. 100% DATA CAPTURE: There are exactly 17 tests on this page. You MUST return 17 parameters.
4. ABSOLUTE FIDELITY: Copy values and units exactly.
3. ABSOLUTE FIDELITY: Copy values, units, and ranges exactly as written.
4. CLINICAL ANALYSIS: For every marker, calculate status and provide specific insight.

Output schema:
{
  "type": "Lab Report",
  "labDetails": { "name": "", "address": "", "contact": "" },
  "patientInfo": { "name": "", "age": "", "gender": "", "date": "", "doctor": "" },
  "results": {
    "parameters": [
      {
        "name": "Full Test Name",
        "value": "Value",
        "unit": "Unit",
        "range": "Ref Range",
        "status": "Status",
        "insight": "Clinical insight",
        "education": "Medical education",
        "creativeSolution": "Lifestyle fix",
        "suggestedSpecialist": "e.g. Hematologist",
        "suggestedMedicine": "e.g. Iron Supplement"
      }
    ],
    "medicines": []
  },
  "summary": "High-level summary",
  "comprehensiveReport": "Exhaustive multi-paragraph analysis of all 17+ findings.",
  "advice": ["Clinical advice 1", "Clinical advice 2"],
  "riskLevel": "Low | Medium | High"
}
`;

const COMPLETENESS_AUDIT_PROMPT = `
You are a strict medical report completeness auditor.
You will receive:
1) OCR lines in reading order
2) The structured report JSON

Task:
1) Audit each OCR line and mark whether it is covered by the report.
2) Recover any missing marker or medicine entries from uncovered lines when explicit data exists.
3) Provide an exhaustive final narrative that captures all meaningful findings A-to-Z.
4) Return JSON only. No markdown.

Return this exact JSON shape:
{
  "lineAudit": [
    {
      "lineNumber": 1,
      "page": 1,
      "text": "",
      "covered": true,
      "mappedTo": "header | marker | medicine | summary | other",
      "reason": ""
    }
  ],
  "recoveredMarkers": [
    {
      "name": "",
      "value": "",
      "unit": "",
      "range": "",
      "lineEvidence": ""
    }
  ],
  "recoveredMedicines": [
    {
      "name": "",
      "dosage": "",
      "frequency": ["Morning", "Afternoon", "Night"],
      "duration": "",
      "purpose": "",
      "lineEvidence": ""
    }
  ],
  "missingCriticalLines": [""],
  "comprehensiveReport": ""
}
`;

const TEXT_TO_REPORT_PROMPT = `
You are an expert clinical text-to-report transformer.
Convert the provided medical text into a structured medical JSON report.

Rules:
1) Never invent values.
2) Preserve all available markers and medicines.
3) Return JSON only.
4) Keep missing fields as empty strings.
`;

const UNIFIED_ANALYSIS_PROMPT = `
You are an elite multimodal medical analysis engine.

TASK:
1. Perform high-fidelity OCR on the provided medical document image.
2. Extract all biomarkers (test names, values, units, ranges) and medicines (name, dosage, frequency, duration).
3. Categorize the document (Lab Report, Prescription, or Other).
4. Provide clinical insights and a comprehensive patient-friendly summary.

RULES:
1. EXHAUSTIVE EXTRACTION: Do not skip any rows or markers.
2. ACCURACY: Preserve numeric values and units exactly as shown.
3. NO INVENTING: If a value is not visible, use an empty string.
4. JSON ONLY: Return the response in the specified JSON format only.

OUTPUT SCHEMA:
{
  "type": "Lab Report | Prescription | Other",
  "labDetails": { "name": "", "address": "", "contact": "" },
  "patientInfo": { "name": "", "age": "", "gender": "", "date": "", "doctor": "" },
  "results": {
    "parameters": [
      {
        "name": "",
        "value": "",
        "unit": "",
        "range": "",
        "status": "Normal|Low|High|Critical|Abnormal|Borderline",
        "insight": "",
        "education": "",
        "creativeSolution": "A holistic or creative health suggestion based on this result",
        "suggestedSpecialist": "The type of doctor recommended",
        "suggestedMedicine": "General category of supportive supplements or medicines (with disclaimer)"
      }
    ],
    "medicines": [
      { "name": "", "dosage": "", "frequency": [], "duration": "", "purpose": "" }
    ]
  },
  "summary": "Brief high-level summary",
  "comprehensiveReport": "Exhaustive A-to-Z explanation of all findings",
  "advice": [],
  "riskLevel": "Low | Medium | High"
}
`;

const SIMPLE_OCR_FALLBACK_PROMPT =
  'Extract all visible text exactly from this medical document. Return plain text only. Do not summarize.';

const VALID_ANALYSIS_SPEEDS = new Set(['fast', 'balanced', 'thorough']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
}

function resolveAnalysisSpeedMode(value = '') {
  const requested = String(value || '').trim().toLowerCase();
  if (VALID_ANALYSIS_SPEEDS.has(requested)) return requested;

  const fromEnv = String(process.env.AI_ANALYSIS_SPEED || process.env.AI_ANALYSIS_MODE || '')
    .trim()
    .toLowerCase();
  if (VALID_ANALYSIS_SPEEDS.has(fromEnv)) return fromEnv;

  // Default to fast for better UX latency.
  return 'fast';
}

function normalizeEntityKey(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toStringSafe(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeWhitespace(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function splitRawTextLines(rawText = '') {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  return lines.map((text, index) => ({
    lineNumber: index + 1,
    page: null,
    text,
  }));
}

function normalizeOcrLine(item = {}, index = 0) {
  const text = normalizeWhitespace(item.text || item.line || item.content || '');
  if (!text) return null;

  const rawLineNumber = Number(item.lineNumber || item.lineNo || item.index || index + 1);
  const rawPage = Number(item.page || item.pageNumber || item.pageNo);

  return {
    lineNumber: Number.isFinite(rawLineNumber) && rawLineNumber > 0 ? Math.trunc(rawLineNumber) : index + 1,
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : null,
    text,
    category: toStringSafe(item.category || item.type || 'other', 'other'),
  };
}

function parseFirstNumber(value) {
  const match = String(value || '')
    .replace(/,/g, '')
    .match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseBoundsFromRange(rangeText = '') {
  const text = String(rangeText || '').replace(/,/g, ' ');

  const explicitPairs = [];
  const pairPattern = /(-?\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(-?\d+(?:\.\d+)?)/gi;
  let match = pairPattern.exec(text);
  while (match) {
    const low = Number(match[1]);
    const high = Number(match[2]);
    if (Number.isFinite(low) && Number.isFinite(high)) {
      explicitPairs.push({ low, high });
    }
    match = pairPattern.exec(text);
  }

  if (explicitPairs.length > 0) {
    let { low, high } = explicitPairs[explicitPairs.length - 1];
    if (low > high) {
      const temp = low;
      low = high;
      high = temp;
    }
    return { low, high };
  }

  const numbers = text.match(/-?\d+(?:\.\d+)?/g) || [];
  if (numbers.length >= 2) {
    let low = Number(numbers[0]);
    let high = Number(numbers[1]);
    if (Number.isFinite(low) && Number.isFinite(high) && low > high) {
      const temp = low;
      low = high;
      high = temp;
    }
    return { low, high };
  }
  if (numbers.length === 1) {
    const n = Number(numbers[0]);
    if (!Number.isFinite(n)) return { low: null, high: null };
    if (/[<≤]/.test(text)) return { low: null, high: n };
    if (/[>≥]/.test(text)) return { low: n, high: null };
  }
  return { low: null, high: null };
}

function deriveStatus(rawStatus, valueText, low, high) {
  const normalizedRaw = toStringSafe(rawStatus);
  const known = normalizedRaw
    ? normalizedRaw[0].toUpperCase() + normalizedRaw.slice(1).toLowerCase()
    : '';

  const value = parseFirstNumber(valueText);
  const canCompute = value !== null && (Number.isFinite(low) || Number.isFinite(high));

  if (canCompute) {
    let computed = 'Normal';
    if (Number.isFinite(low) && value < low) computed = 'Low';
    if (Number.isFinite(high) && value > high) computed = 'High';

    if (known === 'Abnormal' || known === 'Critical' || known === 'Borderline') return known;
    if (known === 'High' || known === 'Low' || known === 'Normal') return computed;
    return computed;
  }

  if (VALID_STATUSES.has(known)) return known;
  return 'Normal';
}

function sanitizeAdvice(advice) {
  if (!Array.isArray(advice)) return [];
  const unique = [];
  for (const item of advice) {
    const value = toStringSafe(item);
    if (!value) continue;
    if (!unique.includes(value)) unique.push(value);
  }
  return unique.slice(0, 6);
}

function ensureFrequency(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringSafe(item))
      .filter(Boolean)
      .slice(0, 4);
  }
  const text = toStringSafe(value).toLowerCase();
  if (!text) return [];
  const freq = [];
  if (text.includes('morning') || text.includes('am')) freq.push('Morning');
  if (text.includes('afternoon') || text.includes('noon')) freq.push('Afternoon');
  if (text.includes('night') || text.includes('pm') || text.includes('evening')) freq.push('Night');
  return freq;
}

function defaultInsight(status, name) {
  if (status === 'High') return `${name} appears elevated versus the stated reference range.`;
  if (status === 'Low') return `${name} appears lower than the stated reference range.`;
  if (status === 'Critical' || status === 'Abnormal') return `${name} shows an abnormal result and needs clinician review.`;
  if (status === 'Borderline') return `${name} is near the edge of normal and should be trended.`;
  return `${name} appears within the available reference context.`;
}

function normalizeParameter(item = {}) {
  const name = toStringSafe(item.name || item.test || item.marker || 'Unknown Marker');
  const value = toStringSafe(item.value || item.result || '--', '--');
  const unit = toStringSafe(item.unit);
  const range = toStringSafe(item.range || item.referenceRange || '--', '--');

  const parsedRange = parseBoundsFromRange(range);
  const lowRaw = Number(item.low);
  const highRaw = Number(item.high);
  const low = Number.isFinite(lowRaw) ? lowRaw : parsedRange.low;
  const high = Number.isFinite(highRaw) ? highRaw : parsedRange.high;

  const status = deriveStatus(item.status, value, low, high);

  return {
    name,
    value,
    unit,
    range,
    low,
    high,
    status,
    insight: toStringSafe(item.insight, defaultInsight(status, name)),
    education: toStringSafe(item.education),
    creativeSolution: toStringSafe(item.creativeSolution),
    suggestedSpecialist: toStringSafe(item.suggestedSpecialist),
    suggestedMedicine: toStringSafe(item.suggestedMedicine),
  };
}

function normalizeMedicine(item = {}) {
  return {
    name: toStringSafe(item.name || 'Unknown Medicine'),
    dosage: toStringSafe(item.dosage || '--', '--'),
    frequency: ensureFrequency(item.frequency),
    duration: toStringSafe(item.duration || '--', '--'),
    purpose: toStringSafe(item.purpose || 'General use', 'General use'),
  };
}

function normalizeForMatch(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9%<>/=.+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokensFromText(value = '') {
  return normalizeForMatch(value)
    .split(' ')
    .filter((token) => token && (token.length >= 2 || /\d/.test(token)));
}

function buildReportTokenSet(report = {}) {
  const tokens = new Set();
  const push = (value) => {
    for (const token of tokensFromText(value)) tokens.add(token);
  };

  const params = Array.isArray(report.results?.parameters) ? report.results.parameters : [];
  const meds = Array.isArray(report.results?.medicines) ? report.results.medicines : [];

  push(report.type);
  push(report.summary);
  push(report.comprehensiveReport);
  push(report.patientInfo?.name);
  push(report.patientInfo?.age);
  push(report.patientInfo?.gender);
  push(report.patientInfo?.date);
  push(report.patientInfo?.doctor);
  push(report.labDetails?.name);
  push(report.labDetails?.address);
  push(report.labDetails?.contact);

  for (const item of params) {
    push(item.name);
    push(item.value);
    push(item.unit);
    push(item.range);
    push(item.status);
    push(item.insight);
    push(item.education);
  }
  for (const item of meds) {
    push(item.name);
    push(item.dosage);
    push(item.duration);
    push(item.purpose);
    push((item.frequency || []).join(' '));
  }

  return tokens;
}

function isCoverageIgnoreLine(text = '') {
  const t = normalizeForMatch(text);
  if (!t) return true;
  if (t.length < 3) return true;
  const ignoreStarts = [
    'department',
    'test name',
    'value',
    'unit',
    'bio ref',
    'cbc',
    'erythrocytes',
    'leucocytes',
    'morphology',
    'differential leucocyte',
    'thrombocytes',
    'sample status',
  ];
  return ignoreStarts.some((prefix) => t.startsWith(prefix));
}

function buildHeuristicLineAudit(report = {}, ocrPayload = {}) {
  const ocrLines = Array.isArray(ocrPayload.lines) && ocrPayload.lines.length > 0
    ? ocrPayload.lines
    : splitRawTextLines(ocrPayload.rawText || '');

  const headerValues = [
    ocrPayload.header?.labName,
    ocrPayload.header?.address,
    ocrPayload.header?.contact,
    ocrPayload.header?.patientName,
    ocrPayload.header?.age,
    ocrPayload.header?.gender,
    ocrPayload.header?.date,
    ocrPayload.header?.doctor,
  ]
    .map((value) => normalizeForMatch(value))
    .filter(Boolean);

  const params = Array.isArray(report.results?.parameters) ? report.results.parameters : [];
  const meds = Array.isArray(report.results?.medicines) ? report.results.medicines : [];
  const summaryBlob = normalizeForMatch(`${report.summary || ''} ${report.comprehensiveReport || ''}`);
  const tokenSet = buildReportTokenSet(report);

  return ocrLines.map((line, idx) => {
    const text = normalizeWhitespace(line.text || '');
    const normalizedLine = normalizeForMatch(text);
    const lineTokens = tokensFromText(normalizedLine);

    if (!normalizedLine) {
      return {
        lineNumber: line.lineNumber || idx + 1,
        page: line.page || null,
        text,
        covered: true,
        mappedTo: 'other',
        reason: 'Empty line',
      };
    }

    if (isCoverageIgnoreLine(normalizedLine)) {
      return {
        lineNumber: line.lineNumber || idx + 1,
        page: line.page || null,
        text,
        covered: true,
        mappedTo: 'other',
        reason: 'Section label or boilerplate',
      };
    }

    if (headerValues.some((value) => value && normalizedLine.includes(value))) {
      return {
        lineNumber: line.lineNumber || idx + 1,
        page: line.page || null,
        text,
        covered: true,
        mappedTo: 'header',
        reason: 'Matched extracted header data',
      };
    }

    for (const marker of params) {
      const markerName = normalizeForMatch(marker.name);
      if (!markerName) continue;
      const markerValue = normalizeForMatch(marker.value);
      if (normalizedLine.includes(markerName) && (!markerValue || normalizedLine.includes(markerValue))) {
        return {
          lineNumber: line.lineNumber || idx + 1,
          page: line.page || null,
          text,
          covered: true,
          mappedTo: 'marker',
          reason: `Matched marker ${marker.name}`,
        };
      }
    }

    for (const medicine of meds) {
      const medName = normalizeForMatch(medicine.name);
      if (medName && normalizedLine.includes(medName)) {
        return {
          lineNumber: line.lineNumber || idx + 1,
          page: line.page || null,
          text,
          covered: true,
          mappedTo: 'medicine',
          reason: `Matched medicine ${medicine.name}`,
        };
      }
    }

    if (summaryBlob && (summaryBlob.includes(normalizedLine) || normalizedLine.includes(summaryBlob))) {
      return {
        lineNumber: line.lineNumber || idx + 1,
        page: line.page || null,
        text,
        covered: true,
        mappedTo: 'summary',
        reason: 'Matched summary text',
      };
    }

    let hitCount = 0;
    for (const token of lineTokens) {
      if (tokenSet.has(token)) hitCount += 1;
    }
    const coverageRatio = lineTokens.length ? hitCount / lineTokens.length : 0;
    const isCoveredByTokens = hitCount >= 5 || coverageRatio >= 0.65;

    return {
      lineNumber: line.lineNumber || idx + 1,
      page: line.page || null,
      text,
      covered: isCoveredByTokens,
      mappedTo: isCoveredByTokens ? 'summary' : 'other',
      reason: isCoveredByTokens
        ? `Token overlap ${Math.round(coverageRatio * 100)}%`
        : 'No reliable match found',
    };
  });
}

function buildCoverageStats(lineAudit = []) {
  const totalLines = lineAudit.length;
  const coveredLines = lineAudit.filter((item) => Boolean(item.covered)).length;
  const uncoveredLines = Math.max(0, totalLines - coveredLines);
  const coveragePercent = totalLines > 0 ? Number(((coveredLines / totalLines) * 100).toFixed(2)) : 100;
  const missingLineSamples = lineAudit
    .filter((item) => !item.covered)
    .slice(0, 10)
    .map((item) => normalizeWhitespace(item.text || ''))
    .filter(Boolean);

  return {
    totalLines,
    coveredLines,
    uncoveredLines,
    coveragePercent,
    missingLineSamples,
  };
}

function normalizeLineAuditEntry(item = {}, index = 0) {
  const text = normalizeWhitespace(item.text || item.line || '');
  if (!text) return null;

  const lineNumberRaw = Number(item.lineNumber || item.lineNo || index + 1);
  const pageRaw = Number(item.page || item.pageNumber);
  const mappedTo = toStringSafe(item.mappedTo || item.classification || 'other', 'other').toLowerCase();

  return {
    lineNumber: Number.isFinite(lineNumberRaw) && lineNumberRaw > 0 ? Math.trunc(lineNumberRaw) : index + 1,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : null,
    text,
    covered: Boolean(item.covered),
    mappedTo,
    reason: toStringSafe(item.reason || item.note),
  };
}

function normalizeAuditPayload(payload = {}) {
  return {
    lineAudit: Array.isArray(payload.lineAudit)
      ? payload.lineAudit.map((item, idx) => normalizeLineAuditEntry(item, idx)).filter(Boolean)
      : [],
    recoveredMarkers: Array.isArray(payload.recoveredMarkers) ? payload.recoveredMarkers : [],
    recoveredMedicines: Array.isArray(payload.recoveredMedicines) ? payload.recoveredMedicines : [],
    missingCriticalLines: Array.isArray(payload.missingCriticalLines)
      ? payload.missingCriticalLines.map((line) => normalizeWhitespace(line)).filter(Boolean).slice(0, 12)
      : [],
    comprehensiveReport: toStringSafe(payload.comprehensiveReport),
  };
}

function buildComprehensiveReportFallback(report = {}, ocrPayload = {}, coverage = null) {
  const params = Array.isArray(report.results?.parameters) ? report.results.parameters : [];
  const meds = Array.isArray(report.results?.medicines) ? report.results.medicines : [];
  const patient = report.patientInfo || {};
  const lab = report.labDetails || {};

  const intro = [
    `Document Type: ${report.type || 'Other'}`,
    `Patient: ${toStringSafe(patient.name, 'Unknown')}`,
    `Age/Gender: ${toStringSafe(patient.age, '--')} / ${toStringSafe(patient.gender, '--')}`,
    `Report Date: ${toStringSafe(patient.date, '--')}`,
    `Doctor: ${toStringSafe(patient.doctor, '--')}`,
    `Lab: ${toStringSafe(lab.name, '--')}`,
    `Address: ${toStringSafe(lab.address, '--')}`,
  ].join(' | ');

  const markerLines = params.length > 0
    ? params
        .map((item, index) =>
          `${index + 1}. ${item.name}: ${item.value} ${item.unit || ''} (Ref: ${item.range || '--'}) -> ${item.status}. ${toStringSafe(
            item.insight,
            ''
          )}`.trim()
        )
        .join(' ')
    : 'No biomarker rows were identified.';

  const medicineLines = meds.length > 0
    ? meds
        .map((item, index) =>
          `${index + 1}. ${item.name}: ${item.dosage}, ${toStringSafe(item.duration, '--')}, ${toStringSafe(item.purpose, '--')}`
        )
        .join(' ')
    : 'No medicine rows were identified.';

  const coverageLine = coverage
    ? `Line audit coverage: ${coverage.coveragePercent}% (${coverage.coveredLines}/${coverage.totalLines} lines covered).`
    : '';

  return [intro, markerLines, medicineLines, coverageLine, toStringSafe(report.summary)]
    .filter(Boolean)
    .join(' ');
}

function normalizeAnalysisShape(data = {}, context = {}) {
  const results = data.results || {};
  const rawParameters = Array.isArray(results.parameters) ? results.parameters : [];
  const rawMedicines = Array.isArray(results.medicines) ? results.medicines : [];

  const parameters = rawParameters.map(normalizeParameter).filter((item) => Boolean(item.name));
  const medicines = rawMedicines.map(normalizeMedicine).filter((item) => Boolean(item.name));

  let type = toStringSafe(data.type, 'Other');
  if (!VALID_REPORT_TYPES.has(type)) {
    if (parameters.length > 0) type = 'Lab Report';
    else if (medicines.length > 0) type = 'Prescription';
    else type = 'Other';
  }

  const riskLevel = VALID_RISK_LEVELS.has(data.riskLevel) ? data.riskLevel : 'Medium';

  return {
    type,
    labDetails: {
      name: toStringSafe(data.labDetails?.name),
      address: toStringSafe(data.labDetails?.address),
      contact: toStringSafe(data.labDetails?.contact),
    },
    patientInfo: {
      name: toStringSafe(data.patientInfo?.name),
      age: toStringSafe(data.patientInfo?.age),
      gender: toStringSafe(data.patientInfo?.gender),
      date: toStringSafe(data.patientInfo?.date),
      doctor: toStringSafe(data.patientInfo?.doctor),
    },
    results: {
      parameters,
      medicines,
    },
    summary: toStringSafe(data.summary, 'AI generated a summary from the uploaded medical document.'),
    comprehensiveReport: toStringSafe(data.comprehensiveReport || data.fullReport || data.summary),
    advice: sanitizeAdvice(data.advice),
    riskLevel,
    quality: {
      extractionMode: 'multistage-ocr',
      analysisSpeed: toStringSafe(context.analysisSpeed || resolveAnalysisSpeedMode()),
      rawTextChars: Number(context.rawTextChars || 0),
      ocrMarkerCandidates: Number(context.ocrMarkerCandidates || 0),
      ocrMedicineCandidates: Number(context.ocrMedicineCandidates || 0),
      recoveredMarkers: 0,
      recoveredMedicines: 0,
      lineCandidates: Number(context.lineCandidates || 0),
      coveredLines: Number(context.coveredLines || 0),
      uncoveredLines: Number(context.uncoveredLines || 0),
      coveragePercent: Number(context.coveragePercent || 0),
      missingLineSamples: Array.isArray(context.missingLineSamples) ? context.missingLineSamples.slice(0, 10) : [],
      missingCriticalLines: Array.isArray(context.missingCriticalLines) ? context.missingCriticalLines.slice(0, 12) : [],
      lineAudit: Array.isArray(context.lineAudit) ? context.lineAudit.slice(0, 160) : [],
      auditMode: toStringSafe(context.auditMode),
    },
  };
}

function extractJsonObject(text = '') {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch (_err) {
    // Continue to object-slice parsing
  }

  const start = cleaned.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;

    if (depth === 0) {
      const candidate = cleaned.slice(start, i + 1);
      try {
        return JSON.parse(candidate);
      } catch (_parseErr) {
        return null;
      }
    }
  }

  return null;
}

function buildModelList(speedMode = 'fast') {
  const configured = resolveGeminiModel();
  
  const stableFlash = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-flash-latest'];
  const futuristicFlash = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3-flash-preview'];
  const stablePro = ['gemini-1.5-pro'];
  const futuristicPro = ['gemini-2.5-pro', 'gemini-3.1-pro-preview'];

  if (speedMode === 'thorough') {
    return [
      'gemini-1.5-flash',
      configured,
      ...stablePro,
      ...futuristicPro,
      ...stableFlash,
      ...futuristicFlash,
    ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
  }

  return [
    'gemini-1.5-flash',
    configured,
    ...stableFlash,
    ...futuristicFlash
  ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
}

function buildPipelineConfig(speedModeInput = '') {
  const speedMode = resolveAnalysisSpeedMode(speedModeInput);

  const base = {
    speedMode,
    models: buildModelList(speedMode),
    maxRetries: 0,
    criticalTimeoutMs: 70000,
    callTimeoutMs: toPositiveInt(process.env.AI_CALL_TIMEOUT_MS, 35000),
    runCompletenessAudit: false,
    includeLineAudit: false,
    ocrTextLimit: 22000,
    markersLimit: 12000,
    medicinesLimit: 8000,
    linesLimit: 220,
    linesTextLimit: 14000,
    auditLinesLimit: 300,
    auditLinesTextLimit: 18000,
    auditReportTextLimit: 18000,
  };

  if (speedMode === 'balanced') {
    return {
      ...base,
      maxRetries: 1,
      criticalTimeoutMs: 120000,
      callTimeoutMs: toPositiveInt(process.env.AI_CALL_TIMEOUT_MS, 50000),
      runCompletenessAudit: true,
      includeLineAudit: true,
      ocrTextLimit: 52000,
      markersLimit: 30000,
      medicinesLimit: 20000,
      linesLimit: 800,
      linesTextLimit: 50000,
      auditLinesLimit: 1000,
      auditLinesTextLimit: 70000,
      auditReportTextLimit: 60000,
    };
  }

  if (speedMode === 'thorough') {
    return {
      ...base,
      maxRetries: 2,
      criticalTimeoutMs: 260000,
      callTimeoutMs: toPositiveInt(process.env.AI_CALL_TIMEOUT_MS, 90000),
      runCompletenessAudit: true,
      includeLineAudit: true,
      ocrTextLimit: 120000,
      markersLimit: 55000,
      medicinesLimit: 35000,
      linesLimit: 1800,
      linesTextLimit: 120000,
      auditLinesLimit: 2200,
      auditLinesTextLimit: 140000,
      auditReportTextLimit: 120000,
    };
  }

  return base;
}

function shouldSkipModel(msg) {
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('not supported') ||
    msg.includes('not enabled') ||
    msg.includes('invalid model') ||
    msg.includes('not_found') ||
    msg.includes('unsupported_model') ||
    msg.includes('model_not_found')
  );
}

function isQuotaError(msg) {
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('limit') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('exhausted') ||
    msg.includes('exhaustion') ||
    msg.includes('exhaust')
  );
}

function isBusyError(msg) {
  return (
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('deadline') ||
    msg.includes('service_unavailable') ||
    msg.includes('server_error') ||
    msg.includes('internal_error')
  );
}

function isApiKeyError(msg) {
  return (
    msg.includes('api key expired') ||
    msg.includes('invalid api key') ||
    msg.includes('api key not valid') ||
    msg.includes('permission denied') ||
    msg.includes('unauthenticated') ||
    msg.includes('invalid_argument') ||
    msg.includes('api_key_invalid') ||
    msg.includes('invalid_key')
  );
}

async function withTimeout(promise, timeoutMs, label = 'operation') {
  const timeout = Number(timeoutMs);
  if (!Number.isFinite(timeout) || timeout <= 0) return promise;

  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeout}ms`)), timeout);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function tryRepairJson(model, rawText, callTimeoutMs = 0) {
  const snippet = String(rawText || '').slice(0, 32000);
  const repairPrompt = `
You are a strict JSON repair assistant.
Convert the following model output into valid JSON object only.
Do not add explanations.

OUTPUT:
${snippet}
`;
  const repaired = await withTimeout(model.generateContent(repairPrompt), callTimeoutMs, 'JSON repair pass');
  const repairedText = (await repaired.response).text();
  return extractJsonObject(repairedText);
}

async function generateJsonWithRepair(model, parts, label, callTimeoutMs = 0) {
  const result = await withTimeout(model.generateContent(parts), callTimeoutMs, label);
  const response = await result.response;
  const text = response.text();
  const parsed = extractJsonObject(text);
  if (parsed) return parsed;

  const repaired = await tryRepairJson(model, text, callTimeoutMs);
  if (repaired) return repaired;

  throw new Error(`${label} returned invalid JSON.`);
}

function normalizeOcrPayload(payload = {}) {
  const rawText = toStringSafe(payload.rawText || payload.text || '');
  const explicitLines = Array.isArray(payload.lines)
    ? payload.lines
    : Array.isArray(payload.lineItems)
    ? payload.lineItems
    : [];
  const normalizedLines = explicitLines.map((item, index) => normalizeOcrLine(item, index)).filter(Boolean);

  return {
    rawText,
    detectedType: toStringSafe(payload.detectedType || payload.type || 'Other'),
    header: {
      labName: toStringSafe(payload.header?.labName),
      address: toStringSafe(payload.header?.address),
      contact: toStringSafe(payload.header?.contact),
      patientName: toStringSafe(payload.header?.patientName),
      age: toStringSafe(payload.header?.age),
      gender: toStringSafe(payload.header?.gender),
      date: toStringSafe(payload.header?.date),
      doctor: toStringSafe(payload.header?.doctor),
    },
    markers: Array.isArray(payload.markers) ? payload.markers : [],
    medicines: Array.isArray(payload.medicines) ? payload.medicines : [],
    lines: normalizedLines.length > 0 ? normalizedLines : splitRawTextLines(rawText),
  };
}

function enrichFromOcr(report, ocrPayload) {
  const existingParams = Array.isArray(report.results?.parameters) ? report.results.parameters : [];
  const existingMeds = Array.isArray(report.results?.medicines) ? report.results.medicines : [];

  const mergedParams = [...existingParams];
  const paramIndex = new Map();
  mergedParams.forEach((item, idx) => {
    paramIndex.set(normalizeEntityKey(item.name), idx);
  });

  let recoveredMarkers = 0;
  for (const rawMarker of ocrPayload.markers || []) {
    const marker = normalizeParameter(rawMarker || {});
    const key = normalizeEntityKey(marker.name);
    if (!key || marker.name === 'Unknown Marker') continue;

    if (!paramIndex.has(key)) {
      recoveredMarkers += 1;
      mergedParams.push({
        ...marker,
        insight: marker.insight || `Recovered from OCR: ${marker.name}. Please verify with your clinician.`,
      });
      paramIndex.set(key, mergedParams.length - 1);
      continue;
    }

    const idx = paramIndex.get(key);
    const existing = mergedParams[idx];
    if ((!existing.value || existing.value === '--') && marker.value && marker.value !== '--') {
      existing.value = marker.value;
    }
    if (!existing.unit && marker.unit) existing.unit = marker.unit;
    if ((!existing.range || existing.range === '--') && marker.range && marker.range !== '--') {
      existing.range = marker.range;
    }
    if (!Number.isFinite(existing.low) && Number.isFinite(marker.low)) existing.low = marker.low;
    if (!Number.isFinite(existing.high) && Number.isFinite(marker.high)) existing.high = marker.high;
    if ((!existing.status || existing.status === 'Normal') && marker.status && marker.status !== 'Normal') {
      existing.status = marker.status;
    }
  }

  const mergedMeds = [...existingMeds];
  const medIndex = new Map();
  mergedMeds.forEach((item, idx) => {
    medIndex.set(normalizeEntityKey(item.name), idx);
  });

  let recoveredMedicines = 0;
  for (const rawMedicine of ocrPayload.medicines || []) {
    const medicine = normalizeMedicine(rawMedicine || {});
    const key = normalizeEntityKey(medicine.name);
    if (!key || medicine.name === 'Unknown Medicine') continue;

    if (!medIndex.has(key)) {
      recoveredMedicines += 1;
      mergedMeds.push(medicine);
      medIndex.set(key, mergedMeds.length - 1);
      continue;
    }

    const idx = medIndex.get(key);
    const existing = mergedMeds[idx];
    if ((!existing.dosage || existing.dosage === '--') && medicine.dosage && medicine.dosage !== '--') {
      existing.dosage = medicine.dosage;
    }
    if ((!existing.duration || existing.duration === '--') && medicine.duration && medicine.duration !== '--') {
      existing.duration = medicine.duration;
    }
    if ((!existing.purpose || existing.purpose === 'General use') && medicine.purpose && medicine.purpose !== 'General use') {
      existing.purpose = medicine.purpose;
    }
    if (existing.frequency.length === 0 && medicine.frequency.length > 0) {
      existing.frequency = medicine.frequency;
    }
  }

  const next = {
    ...report,
    results: {
      ...report.results,
      parameters: mergedParams,
      medicines: mergedMeds,
    },
    quality: {
      ...report.quality,
      recoveredMarkers: Number(report.quality?.recoveredMarkers || 0) + recoveredMarkers,
      recoveredMedicines: Number(report.quality?.recoveredMedicines || 0) + recoveredMedicines,
    },
  };

  if ((!next.patientInfo.name || next.patientInfo.name === '') && ocrPayload.header.patientName) {
    next.patientInfo.name = ocrPayload.header.patientName;
  }
  if ((!next.patientInfo.date || next.patientInfo.date === '') && ocrPayload.header.date) {
    next.patientInfo.date = ocrPayload.header.date;
  }
  if ((!next.patientInfo.age || next.patientInfo.age === '') && ocrPayload.header.age) {
    next.patientInfo.age = ocrPayload.header.age;
  }
  if ((!next.patientInfo.gender || next.patientInfo.gender === '') && ocrPayload.header.gender) {
    next.patientInfo.gender = ocrPayload.header.gender;
  }
  if ((!next.patientInfo.doctor || next.patientInfo.doctor === '') && ocrPayload.header.doctor) {
    next.patientInfo.doctor = ocrPayload.header.doctor;
  }

  if ((!next.labDetails.name || next.labDetails.name === '') && ocrPayload.header.labName) {
    next.labDetails.name = ocrPayload.header.labName;
  }
  if ((!next.labDetails.address || next.labDetails.address === '') && ocrPayload.header.address) {
    next.labDetails.address = ocrPayload.header.address;
  }
  if ((!next.labDetails.contact || next.labDetails.contact === '') && ocrPayload.header.contact) {
    next.labDetails.contact = ocrPayload.header.contact;
  }

  if (next.type === 'Other') {
    if (next.results.parameters.length > 0) next.type = 'Lab Report';
    else if (next.results.medicines.length > 0) next.type = 'Prescription';
  }

  return next;
}

function buildMockModeResponse() {
  return {
    type: 'Lab Report',
    labDetails: { name: '', address: '', contact: '' },
    patientInfo: { name: 'Demo Patient', age: '', gender: '', date: new Date().toLocaleDateString(), doctor: '' },
    results: {
      parameters: [
        {
          name: 'Hemoglobin',
          value: '13.5',
          unit: 'g/dL',
          range: '12-16',
          low: 12,
          high: 16,
          status: 'Normal',
          insight: 'Oxygen-carrying protein is in the healthy range.',
          education: '',
          creativeSolution: '',
          suggestedSpecialist: '',
          suggestedMedicine: '',
        },
        {
          name: 'Glucose (Fasting)',
          value: '112',
          unit: 'mg/dL',
          range: '70-99',
          low: 70,
          high: 99,
          status: 'High',
          insight: 'Slightly elevated blood sugar levels detected.',
          education: '',
          creativeSolution: '',
          suggestedSpecialist: '',
          suggestedMedicine: '',
        },
      ],
      medicines: [],
    },
    summary:
      "This is a SIMULATED analysis (Mock Mode). To see real results, provide a valid Gemini API key starting with 'AIza' in server/.env.",
    comprehensiveReport:
      "This is a SIMULATED analysis in mock mode. Configure a valid Gemini API key in server/.env for full line-by-line OCR auditing, completeness checks, and an exhaustive A-to-Z report.",
    advice: ['Monitor sugar intake', 'Consult your physician for a full metabolic panel'],
    riskLevel: 'Medium',
    quality: {
      extractionMode: 'mock',
      analysisSpeed: 'mock',
      rawTextChars: 0,
      ocrMarkerCandidates: 0,
      ocrMedicineCandidates: 0,
      recoveredMarkers: 0,
      recoveredMedicines: 0,
      lineCandidates: 0,
      coveredLines: 0,
      uncoveredLines: 0,
      coveragePercent: 0,
      missingLineSamples: [],
      missingCriticalLines: [],
      lineAudit: [],
      auditMode: 'mock',
    },
  };
}

function buildQuotaFallbackResponse(lastError = null, analysisSpeed = 'fast') {
  const base = buildMockModeResponse();
  const message = toStringSafe(lastError?.message, 'Quota is currently exhausted.');
  return {
    ...base,
    summary:
      'AI quota is currently exhausted. Returning a safe fallback report so the workflow can continue.',
    comprehensiveReport:
      'The live AI provider is quota-limited right now, so this result uses a temporary fallback. Please retry later for full OCR extraction and clinical synthesis.',
    advice: [
      'Retry after the provider retry window or quota reset.',
      'Add a secondary API key/project in server/.env for automatic failover.',
      'Use this fallback only as a temporary placeholder, not final clinical interpretation.',
    ],
    quality: {
      ...base.quality,
      extractionMode: 'quota-fallback',
      analysisSpeed: toStringSafe(analysisSpeed, 'fast'),
      quotaError: message.slice(0, 400),
    },
  };
}

async function runGroqAnalysis(prompt, textContent) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: 'You are a Clinical Data Extraction Auditor. Your output must be a 100% complete, exhaustive JSON representation of the provided medical text. DO NOT SUMMARIZE. DO NOT SKIP ANY TEST RESULTS. List every single parameter found.' 
        },
        { role: 'user', content: `${prompt}\n\nDocument Text:\n${textContent}` }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0.1
    });

    const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode !== 200) {
            return reject(new Error(`[Groq ${res.statusCode}] ${response.error?.message || data}`));
          }
          const content = response.choices?.[0]?.message?.content;
          resolve(JSON.parse(content));
        } catch (e) {
          reject(new Error(`Failed to parse Groq response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

async function runGroqAuditPass(structuredReport, rawText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `
    You are a Medical Data Auditor. 
    Compare this structured JSON report against the raw OCR text.
    Identify any markers or medicines present in the text but missing from the JSON.
    Return ONLY a JSON object with any recovered entries.
    
    Raw Text: ${rawText}
    Current JSON: ${JSON.stringify(structuredReport)}
    
    Return: { "recoveredMarkers": [...], "recoveredMedicines": [...] }
  `;

  try {
    return await runGroqAnalysis(prompt, '');
  } catch (e) {
    console.warn('[Groq Audit] Audit pass failed, skipping recovery.');
=======
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialization will happen inside the analysis function to ensure process.env is ready
const DEFAULT_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-flash-latest';

const SYSTEM_PROMPT = `
You are an expert Medical OCR + AI reporting engine.
Analyze the provided medical document (image or PDF), including casual phone photos of reports.
Classify it and convert into a clean patient-friendly JSON report.

STEP 1: CLASSIFY
- If it contains biomarker values like Hemoglobin, Glucose, etc. -> "Lab Report"
- If it contains medicine names, dosages, and schedules -> "Prescription"
- Else -> "Other"

STEP 2: EXTRACT & TRANSFORM
Return a valid JSON following this structure:
{
  "type": "Lab Report | Prescription | Other",
  "labDetails": {
    "name": "Extract lab name at the top of the header",
    "address": "Extract full address of the lab/hospital if visible",
    "contact": "Extract phone or email if visible"
  },
  "patientInfo": { "name": "", "age": "", "gender": "", "date": "", "doctor": "" },
  "results": {
       "parameters": [ // ONLY FOR Lab Report
          { 
            "name": "", 
            "value": "", 
            "unit": "", 
            "range": "", 
            "low": 0.0, 
            "high": 0.0, 
            "status": "Normal|Low|High|Critical|Abnormal|Borderline", 
            "insight": "Simple but HIGHLY EMPATHETIC explanation for a layperson",
            "education": "What is this marker? (1-2 sentences)",
            "creativeSolution": "A unique, creative lifestyle or dietary trick for this specific marker",
            "suggestedSpecialist": "What KIND of specialist should they consult? (e.g. Hematologist, Cardiologist, Endocrinologist)",
            "suggestedMedicine": "Common Over-The-Counter or relevant medicine group related to this (add educational context, not prescription)"
          }
       ],
    "medicines": [ // ONLY FOR Prescription
       { "name": "", "dosage": "", "frequency": ["Morning", "Afternoon", "Night"], "duration": "", "purpose": "" }
    ]
  },
  "summary": "Professional yet empathetic summary of findings. Include overarching creative solutions.",
  "advice": ["Actionable advice 1", "Actionable advice 2"],
  "riskLevel": "Low | Medium | High"
}

IMPORTANT: Return ONLY the raw JSON. No markdown blocks.
If some field is missing in source, keep it as empty string.
Do not invent data, only extract and then suggest based on clinical standards.
`;

function extractJsonObject(text = '') {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.error('[Gemini] JSON parse failure:', err.message);
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
    return null;
  }
}

<<<<<<< HEAD
async function runOcrSpaceExtraction(base64Image, mimeType = 'application/pdf', engine = 2) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_OCR_SPACE_API_KEY') return null;

  return new Promise((resolve) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const prefix = mimeType.includes('pdf') ? 'data:application/pdf;base64,' : 'data:image/jpeg;base64,';
    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="apikey"',
      '',
      apiKey,
      `--${boundary}`,
      'Content-Disposition: form-data; name="base64Image"',
      '',
      `${prefix}${base64Image}`,
      `--${boundary}`,
      'Content-Disposition: form-data; name="isTable"',
      '',
      engine === 2 ? 'true' : 'false',
      `--${boundary}`,
      'Content-Disposition: form-data; name="OCREngine"',
      '',
      String(engine),
      `--${boundary}`,
      'Content-Disposition: form-data; name="isOverlayRequired"',
      '',
      'false',
      `--${boundary}--`,
      ''
    ].join('\r\n');

    const req = https.request('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          const text = json.ParsedResults?.[0]?.ParsedText || '';
          
          if (!text && engine === 2) {
            console.log('[OCR Space] Engine 2 returned no text. Retrying with Engine 1...');
            const fallbackText = await runOcrSpaceExtraction(base64Image, mimeType, 1);
            return resolve(fallbackText);
          }

          if (json.ErrorMessage) {
            console.error('[OCR Space Error]:', json.ErrorMessage);
          }

          resolve(text);
        } catch (e) {
          console.error('[OCR Space] JSON Parse Error:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[OCR Space] Connection Error:', err.message);
      resolve(null);
    });
    req.write(payload);
    req.end();
  });
}

async function runOcrPass(model, base64Image, mimeType, pipeline = {}) {
  try {
    const structured = await generateJsonWithRepair(
      model,
      [
        OCR_EXTRACTION_PROMPT,
        {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        },
      ],
      'OCR pass',
      pipeline.callTimeoutMs
    );

    const normalized = normalizeOcrPayload(structured);
    if (normalized.rawText) return normalized;
  } catch (err) {
    console.warn('[Gemini] Direct OCR failed, trying OCR Space fallback...');
    const ocrText = await runOcrSpaceExtraction(base64Image, mimeType);
    if (ocrText) {
      console.log('[OCR Space] Successfully extracted text as fallback.');
      return normalizeOcrPayload({ rawText: ocrText });
    }
    throw err;
  }

  const fallback = await withTimeout(
    model.generateContent([
      SIMPLE_OCR_FALLBACK_PROMPT,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]),
    pipeline.callTimeoutMs,
    'OCR fallback pass'
  );
  const fallbackText = toStringSafe((await fallback.response).text());
  return {
    rawText: fallbackText,
    detectedType: 'Other',
    header: {},
    markers: [],
    medicines: [],
    lines: splitRawTextLines(fallbackText),
  };
}

async function runStructuredReportPass(model, base64Image, mimeType, ocrPayload, previousReportData = null, pipeline = {}) {
  const ocrText = (ocrPayload.rawText || '').slice(0, toPositiveInt(pipeline.ocrTextLimit, 40000));
  const markersText = JSON.stringify(ocrPayload.markers || []).slice(0, toPositiveInt(pipeline.markersLimit, 24000));
  const medicinesText = JSON.stringify(ocrPayload.medicines || []).slice(0, toPositiveInt(pipeline.medicinesLimit, 16000));
  const linesText = JSON.stringify((ocrPayload.lines || []).slice(0, toPositiveInt(pipeline.linesLimit, 600))).slice(
    0,
    toPositiveInt(pipeline.linesTextLimit, 30000)
  );
  const previousText = previousReportData ? JSON.stringify(previousReportData).slice(0, 16000) : '';

  const prompt = `
${STRUCTURED_REPORT_PROMPT}

OCR_TEXT:
${ocrText}

OCR_MARKERS:
${markersText}

OCR_MEDICINES:
${medicinesText}

OCR_LINES:
${linesText}

${previousText ? `PREVIOUS_REPORT_FOR_COMPARISON:\n${previousText}\n` : ''}
`;

  return generateJsonWithRepair(
    model,
    [
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ],
    'Structured analysis pass',
    pipeline.callTimeoutMs
  );
}

async function runCompletenessAuditPass(model, report, ocrPayload, pipeline = {}) {
  const linesText = JSON.stringify((ocrPayload.lines || []).slice(0, toPositiveInt(pipeline.auditLinesLimit, 700))).slice(
    0,
    toPositiveInt(pipeline.auditLinesTextLimit, 50000)
  );
  const reportText = JSON.stringify(report).slice(0, toPositiveInt(pipeline.auditReportTextLimit, 45000));
  const prompt = `
${COMPLETENESS_AUDIT_PROMPT}

OCR_LINES:
${linesText}

STRUCTURED_REPORT:
${reportText}
`;

  return generateJsonWithRepair(model, prompt, 'Completeness audit pass', pipeline.callTimeoutMs);
}

async function runSinglePassAnalysis(model, base64Image, mimeType, previousReportData = null, pipeline = {}) {
  const previousText = previousReportData ? JSON.stringify(previousReportData).slice(0, 16000) : '';
  const prompt = `
${UNIFIED_ANALYSIS_PROMPT}

${previousText ? `PREVIOUS_REPORT_FOR_COMPARISON:\n${previousText}\n` : ''}
`;

  return generateJsonWithRepair(
    model,
    [
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ],
    'Unified single-pass analysis',
    pipeline.callTimeoutMs
  );
}

function shouldRunFastRecovery(structured = {}) {
  const type = toStringSafe(structured?.type);
  const summary = toStringSafe(structured?.summary || structured?.comprehensiveReport);
  const params = Array.isArray(structured?.results?.parameters) ? structured.results.parameters : [];
  const meds = Array.isArray(structured?.results?.medicines) ? structured.results.medicines : [];

  const usableMarkers = params.filter((item) => {
    const name = toStringSafe(item?.name || item?.parameter);
    const value = toStringSafe(item?.value);
    const range = toStringSafe(item?.range);
    const unit = toStringSafe(item?.unit);
    return Boolean(name && (value || range || unit));
  }).length;

  if (type === 'Lab Report' && usableMarkers < 2) return true;
  if (usableMarkers === 0 && meds.length === 0) return true;
  if (summary.length < 120 && usableMarkers <= 1) return true;
  return false;
}

function applyCompletenessAudit(report, ocrPayload, auditPayload = null, options = {}) {
  const includeLineAudit = options.includeLineAudit !== false;
  const lineAuditLimit = toPositiveInt(options.lineAuditLimit, 160);
  const forcedAuditMode = toStringSafe(options.forceAuditMode);
  const heuristicAudit = buildHeuristicLineAudit(report, ocrPayload);
  const normalizedAudit = normalizeAuditPayload(auditPayload || {});
  const lineAudit = normalizedAudit.lineAudit.length > 0 ? normalizedAudit.lineAudit : heuristicAudit;
  const coverage = buildCoverageStats(lineAudit);

  let merged = report;
  if (normalizedAudit.recoveredMarkers.length > 0 || normalizedAudit.recoveredMedicines.length > 0) {
    merged = enrichFromOcr(merged, {
      markers: normalizedAudit.recoveredMarkers,
      medicines: normalizedAudit.recoveredMedicines,
      header: {},
    });
  }

  const comprehensiveReport = toStringSafe(
    normalizedAudit.comprehensiveReport,
    toStringSafe(merged.comprehensiveReport, buildComprehensiveReportFallback(merged, ocrPayload, coverage))
  );

  return {
    ...merged,
    comprehensiveReport,
    quality: {
      ...merged.quality,
      lineCandidates: coverage.totalLines,
      coveredLines: coverage.coveredLines,
      uncoveredLines: coverage.uncoveredLines,
      coveragePercent: coverage.coveragePercent,
      missingLineSamples: coverage.missingLineSamples,
      missingCriticalLines:
        normalizedAudit.missingCriticalLines.length > 0
          ? normalizedAudit.missingCriticalLines
          : coverage.missingLineSamples,
      lineAudit: includeLineAudit ? lineAudit.slice(0, lineAuditLimit) : [],
      auditMode: forcedAuditMode || (normalizedAudit.lineAudit.length > 0 ? 'ai-line-audit' : 'heuristic-line-audit'),
    },
  };
}

async function runTextToReportPass(model, text, previousReportData = null, pipeline = {}) {
  const previousText = previousReportData ? JSON.stringify(previousReportData).slice(0, 16000) : '';
  const prompt = `
${TEXT_TO_REPORT_PROMPT}

MEDICAL_TEXT:
${String(text || '').slice(0, 45000)}

${previousText ? `PREVIOUS_REPORT_FOR_COMPARISON:\n${previousText}\n` : ''}
`;
  return generateJsonWithRepair(model, prompt, 'Text-to-report pass', pipeline.callTimeoutMs);
}

function handleRetryableModelFailure(error, modelName, retryCount, maxRetries) {
  const rawMsg = error.message || '';
  const msg = rawMsg.toLowerCase();

  // Parse retryDelay from Google RPC error if present (e.g. "42s")
  let retryDelaySec = 0;
  const retryMatch = rawMsg.match(/"retryDelay":\s*"(\d+)s"/i) || rawMsg.match(/retry in (\d+)s/i);
  if (retryMatch) {
    retryDelaySec = parseInt(retryMatch[1], 10);
  }

  if (msg.includes('timed out') || msg.includes('timeout')) {
    console.warn(`[Gemini] ${modelName} call timed out. Trying next model...`);
    return { action: 'next-model' };
  }
  if (shouldSkipModel(msg)) {
    console.warn(`[Gemini] Model ${modelName} unavailable/not found. Skipping...`);
    return { action: 'next-model' };
  }
  if (isQuotaError(msg)) {
    // If Google explicitly told us to wait, we should wait at least some of that time
    const waitMs = retryDelaySec > 0 ? Math.min(retryDelaySec * 1000, 5000) : 2000;
    console.warn(`[Gemini Quota] ${modelName} limited. Pausing ${waitMs}ms before next attempt...`);
    return { action: 'next-model', waitMs };
  }
  if (isBusyError(msg) && retryCount < maxRetries) {
    const waitMs = Math.pow(2, retryCount + 1) * 1000 + Math.round(Math.random() * 900);
    return { action: 'retry', waitMs };
  }
  return { action: 'next-model' };
}

async function extractMedicalText(base64Image, mimeType = 'image/jpeg', options = {}) {
  const apiKeys = resolveGeminiApiKeys();
  if (apiKeys.length === 0) {
    return { text: '', markers: [], medicines: [], detectedType: 'Other', header: {}, lines: [] };
  }

  const pipeline = buildPipelineConfig(options.speedMode || 'fast');
  let lastError = null;

  for (const apiKey of apiKeys) {
    const models = pipeline.models;

    for (const modelName of models) {
      try {
        const model = createGeminiModel(apiKey, modelName);
        const ocr = await runOcrPass(model, base64Image, mimeType, pipeline);
        return {
          text: ocr.rawText,
          markers: ocr.markers,
          medicines: ocr.medicines,
          detectedType: ocr.detectedType,
          header: ocr.header,
          lines: ocr.lines,
        };
      } catch (error) {
        lastError = error;
        const msg = error.message?.toLowerCase() || '';
        if (isApiKeyError(msg)) break;
        if (shouldSkipModel(msg) || isQuotaError(msg)) continue;
        if (isBusyError(msg)) {
          await sleep(1200);
          continue;
        }
=======
function normalizeAnalysisShape(data = {}) {
  const type = data.type === 'Lab Report' || data.type === 'Prescription' ? data.type : 'Other';
  const results = data.results || {};

  return {
    type,
    labDetails: {
      name: data.labDetails?.name || '',
      address: data.labDetails?.address || '',
      contact: data.labDetails?.contact || '',
    },
    patientInfo: {
      name: data.patientInfo?.name || '',
      age: data.patientInfo?.age || '',
      gender: data.patientInfo?.gender || '',
      date: data.patientInfo?.date || '',
      doctor: data.patientInfo?.doctor || '',
    },
    results: {
      parameters: Array.isArray(results.parameters) ? results.parameters.map(p => ({
        ...p,
        creativeSolution: p.creativeSolution || '',
        suggestedSpecialist: p.suggestedSpecialist || '',
        suggestedMedicine: p.suggestedMedicine || '',
      })) : [],
      medicines: Array.isArray(results.medicines) ? results.medicines : [],
    },
    summary: data.summary || 'AI generated a summary from the uploaded medical document.',
    advice: Array.isArray(data.advice) ? data.advice : [],
    riskLevel: data.riskLevel || 'Medium',
  };
}

/**
 * Analyzes a medical report image using Gemini.
 */
async function analyzeMedicalReport(base64Image, mimeType = 'image/jpeg', previousReportData = null) {
  const MODELS_TO_TRY = [
    process.env.GOOGLE_GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.5-pro'
  ].filter(Boolean);

  const startTime = Date.now();
  const CRITICAL_TIMEOUT = 160000; // 160s (just under frontend 180s timeout)

  // Eliminate duplicates while maintaining order
  const uniqueModels = [...new Set(MODELS_TO_TRY)];

  let lastError = null;

  for (const modelName of uniqueModels) {
    // If we are getting close to the critical timeout, stop trying new models
    if (Date.now() - startTime > CRITICAL_TIMEOUT) {
      console.warn(`[Gemini] Critical timeout reached. Stopping further model attempts.`);
      break;
    }

    const maxRetries = 2; 
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      // Check timeout inside retry loop too
      if (Date.now() - startTime > CRITICAL_TIMEOUT) break;

      try {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
        
        if (!apiKey || !apiKey.startsWith('AIza')) {
          console.warn('[Gemini Service] Invalid or missing API Key. Entering Mock Mode.');
          await new Promise(r => setTimeout(r, 1000));
          return {
            type: 'Lab Report',
            patientInfo: { name: 'Demo Patient', date: new Date().toLocaleDateString() },
            results: {
              parameters: [
                { name: 'Hemoglobin', value: '13.5', unit: 'g/dL', range: '12-16', status: 'Normal', insight: 'Oxygen-carrying protein is in the healthy range.' },
                { name: 'Glucose (Fasting)', value: '112', unit: 'mg/dL', range: '70-99', status: 'High', insight: 'Slightly elevated blood sugar levels detected.' }
              ]
            },
            summary: "This is a SIMULATED analysis (Mock Mode). To see real results, please provide a valid Gemini API Key starting with 'AIza' in your server/.env file.",
            advice: ["Monitor sugar intake", "Consult your physician for a full metabolic panel"],
            riskLevel: 'Medium'
          };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const contextExtra = previousReportData 
          ? `ALSO COMPARE with the patient's PREVIOUS REPORT: ${JSON.stringify(previousReportData)}. 
             Highlight any improvements or regressions in values.`
          : '';

        console.log(`[Gemini] Attempting ${modelName}...`);
        const result = await model.generateContent([
          SYSTEM_PROMPT + '\n' + contextExtra,
          {
            inlineData: {
              data: base64Image,
              mimeType
            }
          }
        ]);

        const response = await result.response;
        const text = response.text();
        const parsed = extractJsonObject(text);
        if (!parsed) throw new Error('Empty AI response');
        
        return normalizeAnalysisShape(parsed);

      } catch (error) {
        lastError = error;
        const msg = error.message?.toLowerCase() || '';
        
        // 1. Model not found or unsupported - Skip immediately
        const is404 = msg.includes('404') || msg.includes('not found') || msg.includes('not supported') || msg.includes('not enabled');
        if (is404) {
          console.warn(`[Gemini] Model ${modelName} unavailable/not found. Skipping...`);
          break; 
        }

        // 2. Quota Exceeded (429) - Switch to next model immediately
        const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('limit');
        if (isQuota) {
          console.warn(`[Gemini] Model ${modelName} quota exceeded. Checking next model...`);
          break; 
        }

        // 3. Busy / Overloaded (503) - Retry with exponential backoff
        const isBusy = msg.includes('503') || msg.includes('overloaded') || msg.includes('demand') || msg.includes('load') || msg.includes('deadline');
        if (isBusy && retryCount < maxRetries) {
          retryCount++;
          // Exponential backoff: 2s, 4s with some jitter
          const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
          console.warn(`[Gemini] ${modelName} busy (${retryCount}/${maxRetries}). Retrying in ${Math.round(waitTime)}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        // Other errors (e.g. invalid base64, syntax) - Log and skip model
        console.error(`[Gemini Error - ${modelName}]:`, error.message);
        break; 
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
      }
    }
  }

<<<<<<< HEAD
  const lastMsg = String(lastError?.message || '').toLowerCase();
  if (isQuotaError(lastMsg)) {
    return { text: '', markers: [], medicines: [], detectedType: 'Other', header: {}, lines: [] };
  }
  throw new Error(`OCR extraction failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

async function analyzeMedicalReport(base64Image, mimeType = 'image/jpeg', previousReportData = null, options = {}) {
  console.log('[Analysis Pipeline] Starting Groq-Exclusive analysis...');
  
  try {
    // 1. DUAL-ENGINE FUSION (Extract from two sources and merge)
    console.log('[Groq Pipeline] Step 1: Performing Dual-Engine OCR Fusion...');
    const [ocrText2, ocrText1] = await Promise.all([
      runOcrSpaceExtraction(base64Image, mimeType, 2),
      runOcrSpaceExtraction(base64Image, mimeType, 1)
    ]);
    
    // Merge the text (remove duplicates and combine)
    const combinedText = `${ocrText2}\n--- FUSION DATA ---\n${ocrText1}`;
    
    // DEBUG: Save raw text to a file so we can see what the AI sees
    try {
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync(path.resolve(__dirname, '../ocr_debug.txt'), combinedText);
      console.log('[Groq Pipeline] Raw OCR text saved to server/ocr_debug.txt for verification.');
    } catch (e) {
      console.warn('[Groq Pipeline] Failed to save debug log:', e.message);
    }
    
    if (!ocrText2 && !ocrText1) {
      throw new Error('All OCR engines failed to read the document.');
    }

    // 2. Perform synthesis via Groq
    console.log('[Groq Pipeline] Step 2: Running Llama-3.3-70B synthesis on Fusion Data...');
    const structured = await runGroqAnalysis(STRUCTURED_REPORT_PROMPT, combinedText);

    if (!structured) {
      throw new Error('Groq failed to generate a structured report.');
    }

    // 3. Normalize and enrich
    const ocrPayload = normalizeOcrPayload({ rawText: combinedText });
    const normalized = normalizeAnalysisShape(structured, { analysisSpeed: 'groq-fusion-mode' });
    const reconciled = enrichFromOcr(normalized, ocrPayload);

    // 4. Double-Check Audit Pass (The "Zero-Missing" Step)
    console.log('[Groq Pipeline] Step 3: Running "Zero-Missing" Audit Pass...');
    const auditResults = await runGroqAuditPass(reconciled, combinedText);
    
    console.log('[Groq Pipeline] SUCCESS! Final verified report generated.');
    return applyCompletenessAudit(reconciled, ocrPayload, auditResults, { includeLineAudit: false });

  } catch (err) {
    console.error('[Groq Pipeline] CRITICAL ERROR:', err.message);
    // If Groq fails, we no longer fallback to demo mode - we show the error
    throw err;
  }
}

async function analyzeMedicalText(rawText, previousReportData = null, options = {}) {
  const apiKeys = resolveGeminiApiKeys();
  if (apiKeys.length === 0) {
    return buildMockModeResponse();
  }

  const pipeline = buildPipelineConfig(options.speedMode);
  const models = pipeline.models;
  let lastError = null;

  for (const apiKey of apiKeys) {
    for (const modelName of models) {
      const model = createGeminiModel(apiKey, modelName);
      try {
        const structured = await runTextToReportPass(model, rawText, previousReportData, pipeline);
        return normalizeAnalysisShape(structured, {
          analysisSpeed: pipeline.speedMode,
          rawTextChars: String(rawText || '').length,
          ocrMarkerCandidates: 0,
          ocrMedicineCandidates: 0,
        });
      } catch (error) {
        lastError = error;
        const msg = error.message?.toLowerCase() || '';
        if (isApiKeyError(msg)) break;
        if (shouldSkipModel(msg) || isQuotaError(msg)) continue;
        if (isBusyError(msg)) {
          await sleep(1200);
          continue;
        }
        console.error(`[Gemini Text Error - ${modelName}]:`, error.message);
      }
    }
  }

  const lastMsg = String(lastError?.message || '').toLowerCase();
  if (isQuotaError(lastMsg)) {
    console.warn('[Gemini] Text analysis quota exhausted. Returning quota fallback response.');
    return buildQuotaFallbackResponse(lastError, pipeline.speedMode);
  }
  throw new Error(`Text analysis failed. Last error: ${lastError?.message || 'Unknown error'}`);
=======
  throw new Error(`AI analysis failed. Last error: ${lastError?.message}`);
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
}

/**
 * Handles conversational chat about a medical report.
 */
async function chatAboutReport(userMessage, reportData, history = []) {
  try {
<<<<<<< HEAD
    const apiKeys = resolveGeminiApiKeys();
    if (apiKeys.length === 0) {
      return 'AI chat is currently in mock mode. Please configure a valid Gemini API key to enable report chat.';
    }
=======
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
    if (!apiKey || !apiKey.startsWith('AIza')) {
      return 'AI chat is currently in mock mode. Please configure a valid Gemini API key to enable report chat.';
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
    
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })),
    });
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64

    const contextPrompt = `
      You are the LabIntel Medical AI Assistant.
      CONTEXT REPORT: ${JSON.stringify(reportData)}
      GUIDELINES:
      - Answer questions based on the provided report data.
      - Use simple, empathetic language.
      - Be clear about abnormal values.
      - Provide diet/lifestyle suggestions if relevant.
      - ALWAYS include a disclaimer if suggesting supplements or actions.
      USER QUESTION: ${userMessage}
    `;

<<<<<<< HEAD
    const historyParts = history.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));
    const chatModels = [DEFAULT_GEMINI_MODEL, ...buildModelList('fast')]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    let lastError = null;

    for (const apiKey of apiKeys) {
      for (const modelName of chatModels) {
        try {
          const model = createGeminiModel(apiKey, modelName);
          const chat = model.startChat({ history: historyParts });
          const result = await chat.sendMessage(contextPrompt);
          const text = toStringSafe(result.response.text());
          if (text) return text;
        } catch (error) {
          lastError = error;
          const msg = String(error.message || '').toLowerCase();
          if (isApiKeyError(msg)) break;
          if (shouldSkipModel(msg) || isQuotaError(msg) || isBusyError(msg)) continue;
        }
      }
    }

    if (isQuotaError(String(lastError?.message || '').toLowerCase())) {
      return 'AI chat is temporarily quota-limited. Please retry shortly.';
    }
    throw lastError || new Error('Chat response generation failed.');
=======
    const result = await chat.sendMessage(contextPrompt);
    return result.response.text();
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
  } catch (error) {
    console.error('[Gemini Chat Error]:', error);
    throw error;
  }
}

<<<<<<< HEAD
module.exports = {
  analyzeMedicalReport,
  analyzeMedicalText,
  extractMedicalText,
  chatAboutReport,
};
=======
module.exports = { analyzeMedicalReport, chatAboutReport };
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
