'use strict';
/**
 * gemini.js — AI insight generation via Groq Cloud.
 * Drop-in replacement: exports the same functions as the old Gemini version.
 *
 *  generateInsight()     → text-only, uses GROQ_MODEL (llama-3.3-70b-versatile)
 *  analyzeReportImage()  → auto-detects input:
 *                          • PDF  → extract text with pdf-parse → text model
 *                          • Image → Groq vision (llama-4-scout)
 *
 * Never throws — always returns a safe fallback on failure.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Groq   = require('groq-sdk');
const logger = require('../logger');

// ── Models ────────────────────────────────────────────────────────────────────
const TEXT_MODEL   = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

let groqClient = null;

function getClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.startsWith('REPLACE')) return null;
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ── Fallback ──────────────────────────────────────────────────────────────────
const FALLBACK_INSIGHT = {
  summary:        'AI summary could not be generated at this time.',
  findings:       [],
  recommendation: 'Please consult your doctor to interpret these results.',
};

const FALLBACK_OCR = {
  type:        'Lab Report',
  summary:     'Unable to analyze document at this time. Please check API configuration.',
  patientInfo: {},
  labDetails:  {},
  results:     { parameters: [], medicines: [] },
  advice:      [],
  riskLevel:   'Medium',
};

// ── Shared report JSON prompt ─────────────────────────────────────────────────
const REPORT_SCHEMA = `{
  "type": "Lab Report" or "Prescription" or "Other",
  "patientInfo": {
    "name": "Patient full name or 'Unknown'",
    "age": "Age as number or '--'",
    "gender": "Male/Female/Other or '--'",
    "date": "Date of report (YYYY-MM-DD) or today's date",
    "doctor": "Doctor name if visible or empty string"
  },
  "labDetails": {
    "name": "Lab name if visible or 'Diagnostic Laboratory'",
    "address": "Lab address if visible or empty string",
    "contact": "Lab contact if visible or empty string"
  },
  "results": {
    "parameters": [
      {
        "name": "Test parameter name",
        "value": "Numeric value",
        "unit": "Unit of measurement",
        "range": "Reference range e.g. '100-200'",
        "low": numeric_low_value_or_null,
        "high": numeric_high_value_or_null,
        "status": "Normal/Abnormal/Borderline"
      }
    ],
    "medicines": [
      {
        "name": "Medicine name",
        "dosage": "Dosage quantity",
        "frequency": ["Morning","Evening"] or [],
        "duration": "Duration of treatment"
      }
    ]
  },
  "summary": "Brief 2-3 sentence plain-language summary",
  "advice": ["Action 1", "Action 2"],
  "riskLevel": "Low/Medium/High"
}`;

const REPORT_INSTRUCTIONS = `You are an expert medical document analyzer.
Extract ALL visible test results and medicines. Be thorough.
IMPORTANT: Return ONLY valid JSON — no markdown, no code fences, no extra text.
Return empty arrays if nothing found.`;

// ── Normalize & validate the Groq response ────────────────────────────────────
function buildResult(parsed = {}) {
  return {
    type: ['Lab Report', 'Prescription', 'Other'].includes(parsed.type) ? parsed.type : 'Lab Report',
    patientInfo: {
      name:   parsed.patientInfo?.name   || 'Unknown',
      age:    parsed.patientInfo?.age    || '--',
      gender: parsed.patientInfo?.gender || '--',
      date:   parsed.patientInfo?.date   || new Date().toISOString().split('T')[0],
      doctor: parsed.patientInfo?.doctor || '',
    },
    labDetails: {
      name:    parsed.labDetails?.name    || 'Diagnostic Laboratory',
      address: parsed.labDetails?.address || '',
      contact: parsed.labDetails?.contact || '',
    },
    results: {
      parameters: Array.isArray(parsed.results?.parameters) ? parsed.results.parameters : [],
      medicines:  Array.isArray(parsed.results?.medicines)  ? parsed.results.medicines  : [],
    },
    summary:   parsed.summary   || 'Medical report analysis complete. Please review results with your healthcare provider.',
    advice:    Array.isArray(parsed.advice) ? parsed.advice : ['Consult your healthcare provider for interpretation.'],
    riskLevel: parsed.riskLevel || 'Medium',
  };
}

function cleanAndParse(text = '') {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

// ── PDF text extraction ───────────────────────────────────────────────────────
async function extractPdfText(base64Data) {
  const pdfParse = require('pdf-parse');
  // Strip data URL prefix if present
  const raw = base64Data.startsWith('data:')
    ? base64Data.split(',')[1]
    : base64Data;
  const buffer = Buffer.from(raw, 'base64');
  const data   = await pdfParse(buffer);
  return data.text || '';
}

// ── Text insight (for dashboard report summaries) ─────────────────────────────
async function generateInsight(patient, panel, values) {
  const client = getClient();
  if (!client) {
    logger.warn('Groq: GROQ_API_KEY not configured — returning fallback');
    return FALLBACK_INSIGHT;
  }

  const valuesText = values
    .map(v =>
      `${v.name}: ${v.value} ${v.unit || ''} (Normal: ${v.ref_min ?? '?'}–${v.ref_max ?? '?'}) — ${v.flag.toUpperCase()}`
    )
    .join('\n');

  const prompt = `You are a medical AI assistant generating plain-language report summaries.

Patient: ${patient.age}-year-old ${patient.gender}
Test Panel: ${panel.name}

Results:
${valuesText}

Instructions:
- Summarise the key findings in 2-3 sentences in plain, non-technical language.
- List only the abnormal findings (if any).
- Recommend appropriate next steps (always include "consult your doctor").
- NEVER diagnose. NEVER prescribe. Be reassuring but accurate.
- Return ONLY valid JSON — no markdown, no code fences.

Return format:
{
  "summary": "2-3 sentence plain-language overview",
  "findings": ["finding 1", "finding 2"],
  "recommendation": "What the patient should do next"
}`;

  try {
    const completion = await client.chat.completions.create({
      model:    TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    const parsed = cleanAndParse(completion.choices[0]?.message?.content);
    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.findings)) {
      throw new Error('Unexpected Groq response structure');
    }
    return {
      summary:        parsed.summary        || FALLBACK_INSIGHT.summary,
      findings:       parsed.findings       || [],
      recommendation: parsed.recommendation || FALLBACK_INSIGHT.recommendation,
    };
  } catch (err) {
    logger.error(`Groq insight generation failed: ${err.message}`);
    return FALLBACK_INSIGHT;
  }
}

// ── Vision / OCR ─────────────────────────────────────────────────────────────
/**
 * Supports:
 *   • PDF files  (mimeType === 'application/pdf') → text extraction → text model
 *   • Images     (image/jpeg, image/png, etc.)    → Groq vision model
 *
 * @param {string} base64Image - Base64 (with or without data URL prefix)
 * @param {string} mimeType    - e.g. 'image/jpeg', 'application/pdf'
 */
async function analyzeReportImage(base64Image, mimeType = 'image/jpeg') {
  const client = getClient();
  if (!client) {
    logger.warn('Groq: GROQ_API_KEY not configured — returning fallback');
    return FALLBACK_OCR;
  }

  try {
    // ── PDF path ──────────────────────────────────────────────────────────────
    if (mimeType === 'application/pdf') {
      logger.info('OCR: PDF detected — extracting text with pdf-parse');

      let pdfText = '';
      try {
        pdfText = await extractPdfText(base64Image);
      } catch (pdfErr) {
        logger.error(`PDF text extraction failed: ${pdfErr.message}`);
        return {
          ...FALLBACK_OCR,
          summary: 'Could not read this PDF. Please ensure it is a valid, non-scanned PDF or upload a JPG/PNG image of the report instead.',
        };
      }

      if (!pdfText || pdfText.trim().length < 20) {
        logger.warn('OCR: PDF text extraction returned very little text — likely a scanned/image PDF');
        return {
          ...FALLBACK_OCR,
          summary: 'This PDF appears to be a scanned image. Please upload a JPG or PNG image of the report for best results.',
          advice:  ['Take a photo of the physical report and upload it as a JPG or PNG file.'],
        };
      }

      logger.info(`OCR: Extracted ${pdfText.length} characters from PDF`);

      const prompt = `${REPORT_INSTRUCTIONS}

Analyze this medical document text and extract all information:

--- DOCUMENT TEXT START ---
${pdfText.slice(0, 8000)}
--- DOCUMENT TEXT END ---

Return this exact JSON structure:
${REPORT_SCHEMA}`;

      const completion = await client.chat.completions.create({
        model:    TEXT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      const parsed = cleanAndParse(completion.choices[0]?.message?.content);
      return buildResult(parsed);
    }

    // ── Image path ────────────────────────────────────────────────────────────
    logger.info(`OCR: Image detected (${mimeType}) — using Groq vision`);

    let imageData = base64Image;
    if (base64Image.startsWith('data:')) {
      imageData = base64Image.split(',')[1];
    }
    const dataUrl = `data:${mimeType};base64,${imageData}`;

    const prompt = `${REPORT_INSTRUCTIONS}

Analyze this medical report image and extract all information.
Return this exact JSON structure:
${REPORT_SCHEMA}`;

    const completion = await client.chat.completions.create({
      model:    VISION_MODEL,
      messages: [{
        role:    'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text',      text: prompt },
        ],
      }],
      temperature: 0.2,
    });

    const parsed = cleanAndParse(completion.choices[0]?.message?.content);
    return buildResult(parsed);

  } catch (err) {
    logger.error(`Groq OCR failed: ${err.message}`);
    return {
      ...FALLBACK_OCR,
      summary: `Error analyzing document: ${err.message}. Please try with a clearer image or a text-based PDF.`,
      advice:  ['Please upload a clearer image or a standard (non-scanned) PDF.'],
      riskLevel: 'Unknown',
    };
  }
}

module.exports = { generateInsight, analyzeReportImage };
