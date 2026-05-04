'use strict';
/**
 * aiService.js — Groq Cloud AI insight generation.
 * Generates plain-language summaries from structured test results.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Groq = require('groq-sdk');
const logger = require('../logger');

let groq;

function getClient() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      return null;
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

const FALLBACK = {
  summary:        'AI summary could not be generated at this time.',
  findings:       [],
  recommendation: 'Please consult your doctor to interpret these results.',
};

const normalizeFlag = (flag) => String(flag || 'normal').toLowerCase();
const isAbnormalFlag = (flag) => normalizeFlag(flag) !== 'normal';
const toNumber = (value) => {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

function inferSpecialistByMarker(name = '') {
  const n = name.toLowerCase();
  if (n.includes('hemoglobin') || n.includes('rbc') || n.includes('wbc') || n.includes('platelet') || n.includes('mcv') || n.includes('hematocrit')) return 'Hematologist';
  if (n.includes('glucose') || n.includes('hba1c') || n.includes('insulin')) return 'Endocrinologist';
  if (n.includes('creatinine') || n.includes('urea') || n.includes('egfr') || n.includes('uric')) return 'Nephrologist';
  if (n.includes('sgpt') || n.includes('sgot') || n.includes('alt') || n.includes('ast') || n.includes('bilirubin') || n.includes('alp')) return 'Gastroenterologist';
  if (n.includes('ldl') || n.includes('hdl') || n.includes('cholesterol') || n.includes('triglyceride')) return 'Cardiologist';
  if (n.includes('tsh') || n.includes('t3') || n.includes('t4')) return 'Endocrinologist';
  return 'Clinical Pathologist';
}

function inferMedicineGuidance(name = '', flag = '') {
  const n = name.toLowerCase();
  if (!isAbnormalFlag(flag)) return 'No medicine suggested from this marker alone.';
  if (n.includes('hemoglobin') || n.includes('mcv') || n.includes('ferritin') || n.includes('iron')) return 'Discuss iron and folate supplementation plan with your doctor.';
  if (n.includes('glucose') || n.includes('hba1c')) return 'Discuss diabetes-control medication strategy with your doctor.';
  if (n.includes('ldl') || n.includes('cholesterol') || n.includes('triglyceride')) return 'Discuss lipid-control therapy options with your doctor.';
  if (n.includes('creatinine') || n.includes('urea')) return 'Discuss kidney-safe treatment plan with your doctor.';
  if (n.includes('tsh') || n.includes('t3') || n.includes('t4')) return 'Discuss thyroid medication adjustment with your doctor.';
  return 'Discuss targeted treatment options with your doctor based on full clinical context.';
}

function buildDetailedFallback(patient, panel, values, baseInsight = FALLBACK) {
  const abnormal = values.filter((v) => isAbnormalFlag(v.flag));
  const abnormalMarkers = abnormal.map((v) => {
    const specialist = inferSpecialistByMarker(v.name);
    const medicine = inferMedicineGuidance(v.name, v.flag);
    return {
      name: v.name,
      value: String(v.value ?? ''),
      unit: v.unit || '',
      range: `${v.ref_min ?? '?'}-${v.ref_max ?? '?'}`,
      flag: String(v.flag || 'normal'),
      explanation: `${v.name} is outside the reference range and needs clinical correlation.`,
      solution: 'Repeat the test if advised, optimize diet/hydration/sleep, and consult your doctor with this report.',
      doctor_category: specialist,
      referral_reason: `Abnormal ${v.name} requires specialist review in context of complete history.`,
      suggested_medicine: medicine,
    };
  });

  const specialistCounts = abnormalMarkers.reduce((acc, m) => {
    acc[m.doctor_category] = (acc[m.doctor_category] || 0) + 1;
    return acc;
  }, {});
  const topSpecialist = Object.entries(specialistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Clinical Pathologist';
  const riskLevel = abnormal.length === 0 ? 'Low' : abnormal.length >= 3 ? 'High' : 'Medium';

  return {
    summary: baseInsight.summary || 'AI summary could not be generated at this time.',
    findings: Array.isArray(baseInsight.findings) ? baseInsight.findings : [],
    recommendation: baseInsight.recommendation || 'Please consult your doctor to interpret these results.',
    risk_level: riskLevel,
    specialist_type: topSpecialist,
    disease_pattern: abnormal.length ? `${abnormal.length} abnormal marker(s) detected` : 'No abnormal marker detected',
    recommendations: [
      'Consult your doctor with this complete report for clinical confirmation.',
      'Follow hydration, nutrition, and sleep optimization.',
      'Repeat abnormal parameters as advised by your doctor.',
    ],
    medicine_plan: abnormalMarkers.map((m) => m.suggested_medicine).slice(0, 3),
    abnormal_markers: abnormalMarkers,
  };
}

/**
 * @param {object} patient   - { full_name, gender, age }
 * @param {object} panel     - { name }
 * @param {Array}  values    - [{ name, value, unit, ref_min, ref_max, flag }]
 * @returns {Promise<{summary, findings, recommendation}>}
 */
async function generateInsight(patient, panel, values) {
  const client = getClient();
  if (!client) {
    logger.warn('Groq: GROQ_API_KEY not configured — returning fallback');
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
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(chatCompletion.choices[0].message.content);

    return {
      summary:        parsed.summary        || FALLBACK.summary,
      findings:       parsed.findings       || [],
      recommendation: parsed.recommendation || FALLBACK.recommendation,
    };
  } catch (err) {
    logger.error(`Groq insight generation failed: ${err.message}`);
    return FALLBACK;
  }
}

/**
 * Generate detailed AI analysis for report rendering.
 * Output intentionally structured for frontend AI Detailed Analysis screen.
 * @param {object} patient
 * @param {object} panel
 * @param {Array} values
 * @param {object} [baseInsight]
 */
async function generateDetailedInsight(patient, panel, values, baseInsight = FALLBACK) {
  const client = getClient();
  if (!client) {
    logger.warn('Groq: GROQ_API_KEY not configured — returning rule-based detailed fallback');
    return buildDetailedFallback(patient, panel, values, baseInsight);
  }

  const valuesText = values
    .map((v) => {
      const valueNum = toNumber(v.value);
      return [
        `marker=${v.name}`,
        `value=${valueNum ?? v.value}`,
        `unit=${v.unit || ''}`,
        `ref_min=${v.ref_min ?? '?'}`,
        `ref_max=${v.ref_max ?? '?'}`,
        `flag=${String(v.flag || 'normal').toUpperCase()}`,
      ].join(', ');
    })
    .join('\n');

  const prompt = `You are a medical AI assistant creating a patient-friendly detailed report from lab markers.

Patient: ${patient.age}-year-old ${patient.gender}
Panel: ${panel.name}

Markers:
${valuesText}

Rules:
- Never diagnose definitively.
- Never prescribe exact dosage.
- Give practical, safe, educational guidance.
- Focus strongly on abnormal markers.
- Return ONLY valid JSON.

Return JSON exactly:
{
  "summary": "2-4 sentence high quality summary",
  "findings": ["finding"],
  "recommendation": "overall next step recommendation",
  "risk_level": "Low|Medium|High",
  "specialist_type": "Best specialist category",
  "disease_pattern": "Likely clinical pattern (non-diagnostic)",
  "recommendations": ["step 1","step 2","step 3"],
  "medicine_plan": ["general medicine guidance 1","general medicine guidance 2"],
  "abnormal_markers": [
    {
      "name": "marker",
      "value": "value",
      "unit": "unit",
      "range": "min-max",
      "flag": "high|low|critical|abnormal",
      "explanation": "what this abnormality may indicate in plain language",
      "solution": "actionable lifestyle/monitoring guidance",
      "doctor_category": "specialist category",
      "referral_reason": "why referral needed",
      "suggested_medicine": "general medicine class guidance only"
    }
  ]
}`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(chatCompletion.choices[0].message.content);
    const fallback = buildDetailedFallback(patient, panel, values, baseInsight);

    return {
      summary: parsed.summary || fallback.summary,
      findings: Array.isArray(parsed.findings) ? parsed.findings : fallback.findings,
      recommendation: parsed.recommendation || fallback.recommendation,
      risk_level: parsed.risk_level || fallback.risk_level,
      specialist_type: parsed.specialist_type || fallback.specialist_type,
      disease_pattern: parsed.disease_pattern || fallback.disease_pattern,
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length
        ? parsed.recommendations
        : fallback.recommendations,
      medicine_plan: Array.isArray(parsed.medicine_plan) && parsed.medicine_plan.length
        ? parsed.medicine_plan
        : fallback.medicine_plan,
      abnormal_markers: Array.isArray(parsed.abnormal_markers)
        ? parsed.abnormal_markers
        : fallback.abnormal_markers,
    };
  } catch (err) {
    logger.error(`Groq detailed insight generation failed: ${err.message}`);
    return buildDetailedFallback(patient, panel, values, baseInsight);
  }
}

/**
 * Analyze medical report image using Groq Llama 3.2 Vision capability
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Promise<object>} Structured medical report data
 */
async function analyzeReportImage(base64Image, mimeType = 'image/jpeg') {
  const client = getClient();
  if (!client) {
    logger.warn('Groq: GROQ_API_KEY not configured — returning fallback');
    return {
      type: 'Lab Report',
      summary: 'Unable to analyze image at this time. Please check API configuration.',
      patientInfo: {},
      results: { parameters: [], medicines: [] },
      advice: [],
    };
  }

  try {
    const prompt = `CRITICAL MANDATE: Analyze this medical report image and extract EVERY SINGLE test result, biomarker, and medication found.
DO NOT SUMMARIZE. Zero data loss is mandatory. If the report has 100 markers, extract all 100.
For every parameter, you MUST provide a unique 'insight', 'creativeSolution', 'suggestedMedicine', and 'suggestedSpecialist'.

Structure:
{
  "type": "Lab Report" | "Prescription" | "Other",
  "patientInfo": { "name": string, "age": string, "gender": string, "date": string, "doctor": string },
  "labDetails": { "name": string, "address": string, "contact": string },
  "results": {
    "parameters": [ 
      { 
        "name": string, 
        "value": string, 
        "unit": string, 
        "range": string, 
        "status": "Normal"|"Abnormal",
        "insight": "Explain what this specific marker means in simple terms",
        "creativeSolution": "One actionable lifestyle/dietary fix for this specific result",
        "suggestedMedicine": "General medicine category or 'None' if normal",
        "suggestedSpecialist": "Specific type of doctor to consult"
      } 
    ],
    "medicines": [ { "name": string, "dosage": string, "frequency": string[], "duration": string, "purpose": string } ]
  },
  "summary": "Detailed clinical executive summary",
  "advice": string[],
  "riskLevel": "Low" | "Medium" | "High"
}`;

    // Verify base64 and construct clean URL
    const cleanBase64 = base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`;

    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: cleanBase64,
              },
            },
          ],
        },
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.1,
      max_completion_tokens: 8192,
    });

    let content = response.choices[0].message.content;
    
    // Robust JSON parsing: strip markdown code blocks if present
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const parsed = JSON.parse(content);

    return {
      type: parsed.type || 'Lab Report',
      patientInfo: {
        name: parsed.patientInfo?.name || 'Valued Patient',
        age: parsed.patientInfo?.age || '--',
        gender: parsed.patientInfo?.gender || '--',
        date: parsed.patientInfo?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/'),
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
      summary: parsed.summary || 'Medical report analysis complete.',
      advice: Array.isArray(parsed.advice) ? parsed.advice : ['Consult your doctor.'],
      riskLevel: parsed.riskLevel || 'Medium',
    };
  } catch (err) {
    logger.error(`Groq vision analysis failed: ${err.message}`, { 
      status: err.status,
      stack: err.stack
    });
    return {
      type: 'Lab Report',
      summary: `Analysis Error: ${err.message}. Please try again with a clearer photo.`,
      patientInfo: {},
      results: { parameters: [], medicines: [] },
      advice: ['Ensure the photo is well-lit and all text is visible.'],
      riskLevel: 'Unknown',
    };
  }
}

module.exports = { generateInsight, generateDetailedInsight, analyzeReportImage };
