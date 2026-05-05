'use strict';
/**
 * gemini.js — Google Gemini 1.5 Flash AI insight generation.
 * Generates plain-language summaries from structured test results.
 * Always returns a fallback if the AI call fails — never throws.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../logger');

let genAI, model;

function getModel() {
  if (!model) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('REPLACE')) {
      return null;
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }
  return model;
}

const FALLBACK = {
  summary:        'AI summary could not be generated at this time.',
  findings:       [],
  recommendation: 'Please consult your doctor to interpret these results.',
};

/**
 * @param {object} patient   - { full_name, gender, age }
 * @param {object} panel     - { name }
 * @param {Array}  values    - [{ name, value, unit, ref_min, ref_max, flag }]
 * @returns {Promise<{summary, findings, recommendation}>}
 */
async function generateInsight(patient, panel, values) {
  const m = getModel();
  if (!m) {
    logger.warn('Gemini: GEMINI_API_KEY not configured — returning fallback');
    return FALLBACK;
  }

  const valuesText = values
    .map(v =>
      `${v.name}: ${v.value} ${v.unit || ''} (Normal range: ${v.ref_min ?? '?'}–${v.ref_max ?? '?'}) — ${v.flag.toUpperCase()}`
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
    const result = await m.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(text);

    // Validate structure
    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.findings)) {
      throw new Error('Unexpected Gemini response structure');
    }

    return {
      summary:        parsed.summary        || FALLBACK.summary,
      findings:       parsed.findings       || [],
      recommendation: parsed.recommendation || FALLBACK.recommendation,
    };
  } catch (err) {
    logger.error(`Gemini insight generation failed: ${err.message}`);
    return FALLBACK;
  }
}

/**
 * Analyze medical report image using Gemini 1.5 Flash vision capability
 * Extracts text and structure from medical report scans
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Promise<object>} Structured medical report data
 */
async function analyzeReportImage(base64Image, mimeType = 'image/jpeg') {
  const m = getModel();
  if (!m) {
    logger.warn('Gemini: GEMINI_API_KEY not configured — returning fallback');
    return {
      type: 'Lab Report',
      summary: 'Unable to analyze image at this time. Please check API configuration.',
      patientInfo: {},
      results: { parameters: [], medicines: [] },
      advice: [],
    };
  }

  try {
    // Remove data URL prefix if present
    let imageData = base64Image;
    if (base64Image.startsWith('data:')) {
      imageData = base64Image.split(',')[1];
    }

    const prompt = `You are an expert medical document analyzer. Analyze this medical report image and extract all relevant information.

IMPORTANT: Return ONLY valid JSON (no markdown, no code fences, no explanations).

Return the data in this exact JSON structure:
{
  "type": "Lab Report" or "Prescription" or "Other",
  "patientInfo": {
    "name": "Patient full name or 'Unknown'",
    "age": "Age as number or '--'",
    "gender": "Male/Female/Other or '--'",
    "date": "Date of report (YYYY-MM-DD format or today's date)",
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
        "range": "Reference range (e.g., '100-200')",
        "low": numeric_low_value,
        "high": numeric_high_value,
        "status": "Normal/Abnormal/Borderline"
      }
    ],
    "medicines": [
      {
        "name": "Medicine name",
        "dosage": "Dosage quantity",
        "frequency": ["Morning", "Evening"] or [],
        "duration": "Duration of treatment"
      }
    ]
  },
  "summary": "Brief 2-3 sentence plain-language summary of the report",
  "advice": ["Recommended action 1", "Recommended action 2"],
  "riskLevel": "Low/Medium/High"
}

Extract ALL visible test results and medicines. Be thorough. Return empty arrays if none found.`;

    const response = await m.generateContent([
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const text = response.response.text().trim();
    
    // Clean up potential markdown formatting
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate and normalize response
    return {
      type: parsed.type || 'Lab Report',
      patientInfo: {
        name: parsed.patientInfo?.name || 'Unknown',
        age: parsed.patientInfo?.age || '--',
        gender: parsed.patientInfo?.gender || '--',
        date: parsed.patientInfo?.date || new Date().toISOString().split('T')[0],
        doctor: parsed.patientInfo?.doctor || '',
      },
      labDetails: {
        name: parsed.labDetails?.name || 'Diagnostic Laboratory',
        address: parsed.labDetails?.address || '',
        contact: parsed.labDetails?.contact || '',
      },
      results: {
        parameters: Array.isArray(parsed.results?.parameters) ? parsed.results.parameters : [],
        medicines: Array.isArray(parsed.results?.medicines) ? parsed.results.medicines : [],
      },
      summary: parsed.summary || 'Medical report analysis complete. Please review results with your healthcare provider.',
      advice: Array.isArray(parsed.advice) ? parsed.advice : ['Consult your healthcare provider for interpretation.'],
      riskLevel: parsed.riskLevel || 'Medium',
    };
  } catch (err) {
    logger.error(`Gemini image analysis failed: ${err.message}`);
    return {
      type: 'Lab Report',
      summary: `Error analyzing image: ${err.message}. Please try with a clearer image.`,
      patientInfo: {},
      results: { parameters: [], medicines: [] },
      advice: ['Please upload a clearer image of the document.'],
      riskLevel: 'Unknown',
    };
  }
}

module.exports = { generateInsight, analyzeReportImage };
