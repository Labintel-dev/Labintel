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
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

module.exports = { generateInsight };
