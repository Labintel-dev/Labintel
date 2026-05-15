// 'use strict';
// /**
//  * aiService.js — Groq Cloud AI insight generation.
//  * Generates plain-language summaries from structured test results.
//  */
// require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
// const Groq = require('groq-sdk');
// const logger = require('../logger');

// let groq;

// function getClient() {
//   if (!groq) {
//     if (!process.env.GROQ_API_KEY) {
//       return null;
//     }
//     groq = new Groq({
//       apiKey: process.env.GROQ_API_KEY,
//     });
//   }
//   return groq;
// }

// const TEXT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
// const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// const FALLBACK = {
//   summary:        'AI summary could not be generated at this time.',
//   findings:       [],
//   recommendation: 'Please consult your doctor to interpret these results.',
// };

// const FALLBACK_OCR = {
//   type: 'Lab Report',
//   summary: 'Unable to analyze document at this time. Please check API configuration.',
//   patientInfo: {},
//   labDetails: {},
//   results: { parameters: [], medicines: [] },
//   advice: [],
//   riskLevel: 'Medium',
// };

// const REPORT_SCHEMA = `{
//   "type": "Lab Report" | "Prescription" | "Other",
//   "patientInfo": { "name": string, "age": string, "gender": string, "date": string, "doctor": string },
//   "labDetails": { "name": string, "address": string, "contact": string },
//   "results": {
//     "parameters": [
//       {
//         "name": string,
//         "value": string,
//         "unit": string,
//         "range": string,
//         "low": number | null,
//         "high": number | null,
//         "status": "Normal" | "Abnormal" | "Borderline",
//         "insight": string,
//         "creativeSolution": string,
//         "suggestedMedicine": string,
//         "suggestedSpecialist": string
//       }
//     ],
//     "medicines": [
//       { "name": string, "dosage": string, "frequency": string[], "duration": string, "purpose": string }
//     ]
//   },
//   "summary": string,
//   "advice": string[],
//   "riskLevel": "Low" | "Medium" | "High"
// }`;

// const normalizeFlag = (flag) => String(flag || 'normal').toLowerCase();
// const isAbnormalFlag = (flag) => normalizeFlag(flag) !== 'normal';
// const toNumber = (value) => {
//   const parsed = Number.parseFloat(String(value));
//   return Number.isFinite(parsed) ? parsed : null;
// };

// function extractJsonObject(content = '') {
//   const jsonMatch = String(content).match(/\{[\s\S]*\}/);
//   return JSON.parse(jsonMatch ? jsonMatch[0] : content);
// }

// function normalizeReportAnalysis(parsed = {}) {
//   return {
//     type: parsed.type || 'Lab Report',
//     patientInfo: {
//       name: parsed.patientInfo?.name || 'Valued Patient',
//       age: parsed.patientInfo?.age || '--',
//       gender: parsed.patientInfo?.gender || '--',
//       date: parsed.patientInfo?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/'),
//       doctor: parsed.patientInfo?.doctor || '',
//     },
//     labDetails: {
//       name: parsed.labDetails?.name || 'Diagnostic Laboratory',
//       address: parsed.labDetails?.address || '',
//       contact: parsed.labDetails?.contact || '',
//     },
//     results: {
//       parameters: Array.isArray(parsed.results?.parameters) ? parsed.results.parameters : [],
//       medicines: Array.isArray(parsed.results?.medicines) ? parsed.results.medicines : [],
//     },
//     summary: parsed.summary || 'Medical report analysis complete.',
//     advice: Array.isArray(parsed.advice) ? parsed.advice : ['Consult your doctor.'],
//     riskLevel: parsed.riskLevel || 'Medium',
//   };
// }

// async function extractPdfText(base64Data) {
//   const pdfParse = require('pdf-parse');
//   const raw = String(base64Data || '').startsWith('data:')
//     ? String(base64Data).split(',')[1]
//     : base64Data;
//   const buffer = Buffer.from(raw, 'base64');
//   const data = await pdfParse(buffer);
//   return data.text || '';
// }

// function inferSpecialistByMarker(name = '') {
//   const n = name.toLowerCase();
//   if (n.includes('hemoglobin') || n.includes('rbc') || n.includes('wbc') || n.includes('platelet') || n.includes('mcv') || n.includes('hematocrit')) return 'Hematologist';
//   if (n.includes('glucose') || n.includes('hba1c') || n.includes('insulin')) return 'Endocrinologist';
//   if (n.includes('creatinine') || n.includes('urea') || n.includes('egfr') || n.includes('uric')) return 'Nephrologist';
//   if (n.includes('sgpt') || n.includes('sgot') || n.includes('alt') || n.includes('ast') || n.includes('bilirubin') || n.includes('alp')) return 'Gastroenterologist';
//   if (n.includes('ldl') || n.includes('hdl') || n.includes('cholesterol') || n.includes('triglyceride')) return 'Cardiologist';
//   if (n.includes('tsh') || n.includes('t3') || n.includes('t4')) return 'Endocrinologist';
//   return 'Clinical Pathologist';
// }

// function inferMedicineGuidance(name = '', flag = '') {
//   const n = name.toLowerCase();
//   if (!isAbnormalFlag(flag)) return 'No medicine suggested from this marker alone.';
//   if (n.includes('hemoglobin') || n.includes('mcv') || n.includes('ferritin') || n.includes('iron')) return 'Discuss iron and folate supplementation plan with your doctor.';
//   if (n.includes('glucose') || n.includes('hba1c')) return 'Discuss diabetes-control medication strategy with your doctor.';
//   if (n.includes('ldl') || n.includes('cholesterol') || n.includes('triglyceride')) return 'Discuss lipid-control therapy options with your doctor.';
//   if (n.includes('creatinine') || n.includes('urea')) return 'Discuss kidney-safe treatment plan with your doctor.';
//   if (n.includes('tsh') || n.includes('t3') || n.includes('t4')) return 'Discuss thyroid medication adjustment with your doctor.';
//   return 'Discuss targeted treatment options with your doctor based on full clinical context.';
// }

// function buildDetailedFallback(patient, panel, values, baseInsight = FALLBACK) {
//   const abnormal = values.filter((v) => isAbnormalFlag(v.flag));
//   const abnormalMarkers = abnormal.map((v) => {
//     const specialist = inferSpecialistByMarker(v.name);
//     const medicine = inferMedicineGuidance(v.name, v.flag);
//     return {
//       name: v.name,
//       value: String(v.value ?? ''),
//       unit: v.unit || '',
//       range: `${v.ref_min ?? '?'}-${v.ref_max ?? '?'}`,
//       flag: String(v.flag || 'normal'),
//       explanation: `${v.name} is outside the reference range and needs clinical correlation.`,
//       solution: 'Repeat the test if advised, optimize diet/hydration/sleep, and consult your doctor with this report.',
//       doctor_category: specialist,
//       referral_reason: `Abnormal ${v.name} requires specialist review in context of complete history.`,
//       suggested_medicine: medicine,
//     };
//   });

//   const specialistCounts = abnormalMarkers.reduce((acc, m) => {
//     acc[m.doctor_category] = (acc[m.doctor_category] || 0) + 1;
//     return acc;
//   }, {});
//   const topSpecialist = Object.entries(specialistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Clinical Pathologist';
//   const riskLevel = abnormal.length === 0 ? 'Low' : abnormal.length >= 3 ? 'High' : 'Medium';

//   return {
//     summary: baseInsight.summary || 'AI summary could not be generated at this time.',
//     findings: Array.isArray(baseInsight.findings) ? baseInsight.findings : [],
//     recommendation: baseInsight.recommendation || 'Please consult your doctor to interpret these results.',
//     risk_level: riskLevel,
//     specialist_type: topSpecialist,
//     disease_pattern: abnormal.length ? `${abnormal.length} abnormal marker(s) detected` : 'No abnormal marker detected',
//     recommendations: [
//       'Consult your doctor with this complete report for clinical confirmation.',
//       'Follow hydration, nutrition, and sleep optimization.',
//       'Repeat abnormal parameters as advised by your doctor.',
//     ],
//     medicine_plan: abnormalMarkers.map((m) => m.suggested_medicine).slice(0, 3),
//     abnormal_markers: abnormalMarkers,
//   };
// }

// /**
//  * @param {object} patient   - { full_name, gender, age }
//  * @param {object} panel     - { name }
//  * @param {Array}  values    - [{ name, value, unit, ref_min, ref_max, flag }]
//  * @returns {Promise<{summary, findings, recommendation}>}
//  */
// async function generateInsight(patient, panel, values) {
//   const client = getClient();
//   if (!client) {
//     logger.warn('Groq: GROQ_API_KEY not configured — returning fallback');
//     return FALLBACK;
//   }

//   const valuesText = values
//     .map(v =>
//       `${v.name}: ${v.value} ${v.unit || ''} (Normal range: ${v.ref_min ?? '?'}–${v.ref_max ?? '?'}) — ${v.flag.toUpperCase()}`
//     )
//     .join('\n');

//   const prompt = `You are a medical AI assistant generating plain-language report summaries.

// Patient: ${patient.age}-year-old ${patient.gender}
// Test Panel: ${panel.name}

// Results:
// ${valuesText}

// Instructions:
// - Summarise the key findings in 2-3 sentences in plain, non-technical language.
// - List only the abnormal findings (if any).
// - Recommend appropriate next steps (always include "consult your doctor").
// - NEVER diagnose. NEVER prescribe. Be reassuring but accurate.
// - Return ONLY valid JSON — no markdown, no code fences.

// Return format:
// {
//   "summary": "2-3 sentence plain-language overview",
//   "findings": ["finding 1", "finding 2"],
//   "recommendation": "What the patient should do next"
// }`;

//   try {
//     const chatCompletion = await client.chat.completions.create({
//       messages: [
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//       model: TEXT_MODEL,
//       response_format: { type: 'json_object' },
//     });

//     const parsed = JSON.parse(chatCompletion.choices[0].message.content);

//     return {
//       summary:        parsed.summary        || FALLBACK.summary,
//       findings:       parsed.findings       || [],
//       recommendation: parsed.recommendation || FALLBACK.recommendation,
//     };
//   } catch (err) {
//     logger.error(`Groq insight generation failed: ${err.message}`);
//     return FALLBACK;
//   }
// }

// /**
//  * Generate detailed AI analysis for report rendering.
//  * Output intentionally structured for frontend AI Detailed Analysis screen.
//  * @param {object} patient
//  * @param {object} panel
//  * @param {Array} values
//  * @param {object} [baseInsight]
//  */
// async function generateDetailedInsight(patient, panel, values, baseInsight = FALLBACK) {
//   const client = getClient();
//   if (!client) {
//     logger.warn('Groq: GROQ_API_KEY not configured — returning rule-based detailed fallback');
//     return buildDetailedFallback(patient, panel, values, baseInsight);
//   }

//   const valuesText = values
//     .map((v) => {
//       const valueNum = toNumber(v.value);
//       return [
//         `marker=${v.name}`,
//         `value=${valueNum ?? v.value}`,
//         `unit=${v.unit || ''}`,
//         `ref_min=${v.ref_min ?? '?'}`,
//         `ref_max=${v.ref_max ?? '?'}`,
//         `flag=${String(v.flag || 'normal').toUpperCase()}`,
//       ].join(', ');
//     })
//     .join('\n');

//   const prompt = `You are a medical AI assistant creating a patient-friendly detailed report from lab markers.

// Patient: ${patient.age}-year-old ${patient.gender}
// Panel: ${panel.name}

// Markers:
// ${valuesText}

// Rules:
// - Never diagnose definitively.
// - Never prescribe exact dosage.
// - Give practical, safe, educational guidance.
// - Focus strongly on abnormal markers.
// - Return ONLY valid JSON.

// Return JSON exactly:
// {
//   "summary": "2-4 sentence high quality summary",
//   "findings": ["finding"],
//   "recommendation": "overall next step recommendation",
//   "risk_level": "Low|Medium|High",
//   "specialist_type": "Best specialist category",
//   "disease_pattern": "Likely clinical pattern (non-diagnostic)",
//   "recommendations": ["step 1","step 2","step 3"],
//   "medicine_plan": ["general medicine guidance 1","general medicine guidance 2"],
//   "abnormal_markers": [
//     {
//       "name": "marker",
//       "value": "value",
//       "unit": "unit",
//       "range": "min-max",
//       "flag": "high|low|critical|abnormal",
//       "explanation": "what this abnormality may indicate in plain language",
//       "solution": "actionable lifestyle/monitoring guidance",
//       "doctor_category": "specialist category",
//       "referral_reason": "why referral needed",
//       "suggested_medicine": "general medicine class guidance only"
//     }
//   ]
// }`;

//   try {
//     const chatCompletion = await client.chat.completions.create({
//       messages: [{ role: 'user', content: prompt }],
//       model: TEXT_MODEL,
//       response_format: { type: 'json_object' },
//     });

//     const parsed = JSON.parse(chatCompletion.choices[0].message.content);
//     const fallback = buildDetailedFallback(patient, panel, values, baseInsight);

//     return {
//       summary: parsed.summary || fallback.summary,
//       findings: Array.isArray(parsed.findings) ? parsed.findings : fallback.findings,
//       recommendation: parsed.recommendation || fallback.recommendation,
//       risk_level: parsed.risk_level || fallback.risk_level,
//       specialist_type: parsed.specialist_type || fallback.specialist_type,
//       disease_pattern: parsed.disease_pattern || fallback.disease_pattern,
//       recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length
//         ? parsed.recommendations
//         : fallback.recommendations,
//       medicine_plan: Array.isArray(parsed.medicine_plan) && parsed.medicine_plan.length
//         ? parsed.medicine_plan
//         : fallback.medicine_plan,
//       abnormal_markers: Array.isArray(parsed.abnormal_markers)
//         ? parsed.abnormal_markers
//         : fallback.abnormal_markers,
//     };
//   } catch (err) {
//     logger.error(`Groq detailed insight generation failed: ${err.message}`);
//     return buildDetailedFallback(patient, panel, values, baseInsight);
//   }
// }

// /**
//  * Analyze medical report image using Groq Llama 3.2 Vision capability
//  * @param {string} base64Image - Base64 encoded image
//  * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
//  * @returns {Promise<object>} Structured medical report data
//  */
// async function analyzeReportImage(base64Image, mimeType = 'image/jpeg') {
//   const client = getClient();
//   if (!client) {
//     logger.warn('Groq: GROQ_API_KEY not configured - returning fallback');
//     return FALLBACK_OCR;
//   }

//   try {
//     if (mimeType === 'application/pdf') {
//       logger.info('OCR: PDF detected - extracting text with pdf-parse');

//       let pdfText = '';
//       try {
//         pdfText = await extractPdfText(base64Image);
//       } catch (pdfErr) {
//         logger.error(`PDF text extraction failed: ${pdfErr.message}`);
//         return {
//           ...FALLBACK_OCR,
//           summary: 'Could not read this PDF. Please upload a text-based PDF or a clear JPG/PNG image of the report.',
//           advice: ['Try uploading a clearer image if this PDF is a scanned document.'],
//         };
//       }

//       if (!pdfText || pdfText.trim().length < 20) {
//         return {
//           ...FALLBACK_OCR,
//           summary: 'This PDF appears to contain very little readable text. Please upload a JPG or PNG image of the report.',
//           advice: ['Take a clear photo of the report and upload it as an image.'],
//         };
//       }

//       const pdfPrompt = `You are an expert medical document analyzer.
// Extract every visible test result, biomarker, medicine, patient detail, and lab detail from this medical document text.
// Return ONLY valid JSON. Do not include markdown or explanations.

// Document text:
// ${pdfText.slice(0, 12000)}

// Return this JSON shape:
// ${REPORT_SCHEMA}`;

//       const pdfResponse = await client.chat.completions.create({
//         messages: [{ role: 'user', content: pdfPrompt }],
//         model: TEXT_MODEL,
//         temperature: 0.1,
//         response_format: { type: 'json_object' },
//       });

//       const parsed = extractJsonObject(pdfResponse.choices[0]?.message?.content || '{}');
//       return normalizeReportAnalysis(parsed);
//     }

//     const prompt = `CRITICAL MANDATE: Analyze this medical report image and extract EVERY SINGLE test result, biomarker, and medication found.
// DO NOT SUMMARIZE. Zero data loss is mandatory. If the report has 100 markers, extract all 100.
// Identify the patient name, age, and gender with absolute precision. Look for institutional headers and footers.

// Structure:
// {
//   "type": "Lab Report" | "Prescription" | "Other",
//   "patientInfo": { "name": string, "age": string, "gender": string, "date": string, "doctor": string },
//   "labDetails": { "name": string, "address": string, "contact": string },
//   "results": {
//     "parameters": [
//       {
//         "name": string,
//         "value": string,
//         "unit": string,
//         "range": string,
//         "status": "Normal"|"Abnormal",
//         "insight": "Explain what this specific marker means in simple terms",
//         "creativeSolution": "One actionable lifestyle/dietary fix for this specific result",
//         "suggestedMedicine": "General medicine category or 'None' if normal",
//         "suggestedSpecialist": "Specific type of doctor to consult"
//       }
//     ],
//     "medicines": [ { "name": string, "dosage": string, "frequency": string[], "duration": string, "purpose": string } ]
//   },
//   "summary": "Detailed clinical executive summary",
//   "advice": string[],
//   "riskLevel": "Low" | "Medium" | "High"
// }`;

//     // Verify base64 and construct clean URL
//     const cleanBase64 = base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`;

//     const response = await client.chat.completions.create({
//       messages: [
//         {
//           role: 'user',
//           content: [
//             { type: 'text', text: prompt },
//             {
//               type: 'image_url',
//               image_url: {
//                 url: cleanBase64,
//               },
//             },
//           ],
//         },
//       ],
//       model: VISION_MODEL,
//       temperature: 0.1,
//       max_completion_tokens: 8192,
//     });

//     const parsed = extractJsonObject(response.choices[0]?.message?.content || '{}');
//     return normalizeReportAnalysis(parsed);
//   } catch (err) {
//     logger.error(`Groq vision analysis failed: ${err.message}`, {
//       status: err.status,
//       stack: err.stack
//     });
//     return {
//       type: 'Lab Report',
//       summary: `Analysis Error: ${err.message}. Please try again with a clearer photo.`,
//       patientInfo: {},
//       results: { parameters: [], medicines: [] },
//       advice: ['Ensure the photo is well-lit and all text is visible.'],
//       riskLevel: 'Unknown',
//     };
//   }
// }

// async function translateTextToHindi(text) {
//   const source = String(text || '').trim();
//   if (!source) return '';

//   const client = getClient();
//   if (!client) {
//     logger.warn('Groq: GROQ_API_KEY not configured - returning original text for Hindi translation');
//     return source;
//   }

//   const prompt = `Translate the following medical summary into clear, natural Hindi in Devanagari script.

// Rules:
// - Keep the exact meaning.
// - Keep it easy for patients to understand.
// - Do not add or remove medical intent.
// - Return only translated Hindi text, no JSON and no explanation.

// Text:
// ${source}`;

//   try {
//     const response = await client.chat.completions.create({
//       messages: [{ role: 'user', content: prompt }],
//       model: TEXT_MODEL,
//       temperature: 0.2,
//       max_tokens: 600,
//     });

//     const translated = String(response?.choices?.[0]?.message?.content || '').trim();
//     return translated || source;
//   } catch (err) {
//     logger.error(`Hindi translation failed: ${err.message}`);
//     return source;
//   }
// }

// module.exports = { generateInsight, generateDetailedInsight, analyzeReportImage, translateTextToHindi };

// ================================
// FILE: services/aiService.js
// ================================

// 'use strict';

// require('dotenv').config({
//   path: require('path').join(__dirname, '../.env'),
// });

// const Groq = require('groq-sdk');
// const logger = require('../logger');

// let groq;

// function getClient() {
//   if (!groq) {
//     if (!process.env.GROQ_API_KEY) {
//       return null;
//     }

//     groq = new Groq({
//       apiKey: process.env.GROQ_API_KEY,
//     });
//   }

//   return groq;
// }

// const TEXT_MODEL =
//   process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// const FALLBACK = {
//   summary: 'AI summary could not be generated.',
//   findings: [],
//   recommendation: 'Please consult your doctor.',
// };

// // =========================================
// // BASIC AI SUMMARY
// // =========================================

// async function generateInsight(patient, panel, values) {
//   const client = getClient();

//   if (!client) {
//     logger.warn('GROQ API KEY missing');
//     return FALLBACK;
//   }

//   try {
//     const valuesText = values
//       .map(
//         (v) =>
//           `${v.name}: ${v.value} ${v.unit || ''} (${v.flag})`
//       )
//       .join('\n');

//     const prompt = `
// You are a medical AI assistant.

// Patient:
// Age: ${patient.age}
// Gender: ${patient.gender}

// Panel:
// ${panel.name}

// Results:
// ${valuesText}

// Rules:
// - Explain simply
// - Do not diagnose
// - Return only JSON

// Return:
// {
//   "summary": "",
//   "findings": [],
//   "recommendation": ""
// }
// `;

//     const response =
//       await client.chat.completions.create({
//         messages: [
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//         model: TEXT_MODEL,
//         response_format: {
//           type: 'json_object',
//         },
//       });

//     const parsed = JSON.parse(
//       response.choices[0].message.content
//     );

//     return {
//       summary: parsed.summary || FALLBACK.summary,
//       findings: parsed.findings || [],
//       recommendation:
//         parsed.recommendation ||
//         FALLBACK.recommendation,
//     };
//   } catch (err) {
//     logger.error(err.message);

//     return FALLBACK;
//   }
// }

// // =========================================
// // DETAILED AI ANALYSIS
// // =========================================

// async function generateDetailedInsight(
//   patient,
//   panel,
//   values
// ) {
//   const client = getClient();

//   if (!client) {
//     logger.warn('GROQ API KEY missing');

//     return {
//       summary: 'Detailed analysis unavailable.',
//       findings: [],
//       recommendation:
//         'Please consult your doctor.',
//       risk_level: 'Medium',
//     };
//   }

//   try {
//     const valuesText = values
//       .map(
//         (v) => `
// Marker: ${v.name}
// Value: ${v.value}
// Unit: ${v.unit || ''}
// Range: ${v.ref_min || '-'} - ${
//           v.ref_max || '-'
//         }
// Status: ${v.flag}
// `
//       )
//       .join('\n');

//     const prompt = `
// You are an advanced medical AI assistant.

// Generate a detailed but patient-friendly report.

// Patient:
// Age: ${patient.age}
// Gender: ${patient.gender}

// Test Panel:
// ${panel.name}

// Lab Results:
// ${valuesText}

// Rules:
// - Use simple desi Hindi style explanation
// - Never diagnose
// - Never prescribe exact medicine dosage
// - Explain abnormalities carefully
// - Return ONLY valid JSON

// JSON FORMAT:
// {
//   "summary": "",
//   "findings": [],
//   "recommendation": "",
//   "risk_level": "",
//   "recommendations": [],
//   "abnormal_markers": [
//     {
//       "name": "",
//       "value": "",
//       "status": "",
//       "explanation": "",
//       "solution": ""
//     }
//   ]
// }
// `;

//     const response =
//       await client.chat.completions.create({
//         messages: [
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//         model: TEXT_MODEL,
//         response_format: {
//           type: 'json_object',
//         },
//       });

//     const parsed = JSON.parse(
//       response.choices[0].message.content
//     );

//     return parsed;
//   } catch (err) {
//     logger.error(
//       `Detailed Insight Error: ${err.message}`
//     );

//     return {
//       summary: 'Detailed analysis failed.',
//       findings: [],
//       recommendation:
//         'Please consult your doctor.',
//       risk_level: 'Medium',
//     };
//   }
// }

// // =========================================
// // OCR IMAGE ANALYSIS
// // =========================================

// async function analyzeReportImage(
//   base64Image,
//   mimeType = 'image/jpeg'
// ) {
//   const client = getClient();

//   if (!client) {
//     return {
//       summary: 'OCR unavailable.',
//       results: [],
//     };
//   }

//   try {
//     const response =
//       await client.chat.completions.create({
//         messages: [
//           {
//             role: 'user',
//             content: [
//               {
//                 type: 'text',
//                 text: `
// Extract all medical report data.
// Return JSON only.
// `,
//               },
//               {
//                 type: 'image_url',
//                 image_url: {
//                   url: `data:${mimeType};base64,${base64Image}`,
//                 },
//               },
//             ],
//           },
//         ],
//         model:
//           'meta-llama/llama-4-scout-17b-16e-instruct',
//       });

//     return JSON.parse(
//       response.choices[0].message.content
//     );
//   } catch (err) {
//     logger.error(err.message);

//     return {
//       summary: 'OCR failed.',
//       results: [],
//     };
//   }
// }

// // =========================================
// // HINDI TRANSLATION
// // =========================================

// async function translateTextToHindi(text) {
//   const source = String(text || '').trim();

//   if (!source) return '';

//   const client = getClient();

//   if (!client) {
//     return source;
//   }

//   try {
//     const prompt = `
// Tum ek desi Hindi medical assistant ho.

// Neeche diye gaye medical text ko
// simple desi Hindi me convert karo.

// Rules:
// - Natural Hindi
// - Easy language
// - No modern hard Hindi
// - Return only translated text

// Text:
// ${source}
// `;

//     const response =
//       await client.chat.completions.create({
//         messages: [
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//         model: TEXT_MODEL,
//       });

//     return (
//       response?.choices?.[0]?.message?.content ||
//       source
//     );
//   } catch (err) {
//     logger.error(err.message);

//     return source;
//   }
// }

// // =========================================
// // EXPORTS
// // =========================================

// module.exports = {
//   generateInsight,
//   generateDetailedInsight,
//   analyzeReportImage,
//   translateTextToHindi,
// };
'use strict';

require('dotenv').config({
  path: require('path').join(__dirname, '../.env'),
});

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

const TEXT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const FALLBACK = {
  summary: 'AI summary could not be generated.',
  findings: [],
  recommendation: 'Please consult your doctor.',
};

// =========================================
// BASIC AI SUMMARY
// =========================================

async function generateInsight(patient, panel, values) {
  const client = getClient();

  if (!client) {
    logger.warn('GROQ API KEY missing');
    return FALLBACK;
  }

  try {
    const valuesText = values
      .map((v) => `${v.name}: ${v.value} ${v.unit || ''} (${v.flag})`)
      .join('\n');

    const prompt = `
You are a helpful medical assistant. Generate a summary for a patient.

Patient: Age ${patient.age}, ${patient.gender}
Panel: ${panel.name}
Results:
${valuesText}

Rules:
1. IDENTIFY: Mention the likely condition (e.g., Anemia).
2. ADVISE: Suggest specific natural foods and exercises.
3. HABITS: List 1-2 Do's and Don'ts.
4. NO MEDICINE: Do NOT mention any drugs.
5. HINDI SCRIPT: Generate a short, friendly Hindi narration script (Devanagari).
6. JSON: Return ONLY valid JSON.

Return:
{
  "summary": "Friendly 3-4 sentence summary in English.",
  "findings": [],
  "recommendation": "Consult a doctor for clinical confirmation.",
  "hindiVoiceScript": "Warm Hindi script..."
}
`;

    const response = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: TEXT_MODEL,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const parsed = robustParseJson(content);

    return {
      summary: parsed?.summary || FALLBACK.summary,
      findings: parsed?.findings || [],
      recommendation: parsed?.recommendation || FALLBACK.recommendation,
    };
  } catch (err) {
    logger.error(`Basic Insight Error: ${err.message}`);
    return FALLBACK;
  }
}

// =========================================
// DETAILED AI ANALYSIS
// =========================================

/**
 * Enhanced JSON extraction that handles common AI formatting errors.
 */
function robustParseJson(text) {
  if (!text) return null;
  try {
    // 1. Direct parse
    return JSON.parse(text);
  } catch (err) {
    try {
      // 2. Try to extract JSON block { ... }
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        let jsonStr = match[0];
        // Common fix: Replace single quotes used as string delimiters (risky but often helpful)
        // Only if they are at the start/end of a property or value
        // But better yet, just try to parse the extracted block
        return JSON.parse(jsonStr);
      }
    } catch (err2) {
      // 3. Last ditch: clean up common issues like trailing commas or single quotes at ends
      try {
        const cleaned = text
          .replace(/,\s*([\]}])/g, '$1') // Trailing commas
          .replace(/'\s*([,\]}])/g, '"$1') // Single quotes at end of values
          .replace(/:\s*'/g, ': "'); // Single quotes at start of values
        const match2 = cleaned.match(/\{[\s\S]*\}/);
        if (match2) return JSON.parse(match2[0]);
      } catch (err3) {
        return null;
      }
    }
  }
  return null;
}

/**
 * Generate detailed AI analysis for report rendering.
 * Includes retries and fallback for maximum reliability.
 */
async function generateDetailedInsight(patient, panel, values, retries = 2) {
  const client = getClient();
  if (!client) {
    logger.warn('Groq: GROQ_API_KEY missing — using rules fallback');
    return {
      summary: 'Detailed analysis unavailable (API key missing).',
      findings: [],
      recommendation: 'Please consult your doctor.',
      risk_level: 'Medium',
    };
  }

  const valuesText = values
    .map((v) => `Marker: ${v.name}, Value: ${v.value} ${v.unit || ''}, Range: ${v.ref_min || '-'}-${v.ref_max || '-'}, Status: ${v.flag}`)
    .join('\n');

  const prompt = `
You are an Advanced AI Health Report Assistant. Generate a detailed interpretation in ENGLISH.

Patient: Age ${patient.age}, ${patient.gender}
Values:
${valuesText}

INSTRUCTIONS:
Generate a response with 9 specific sections in the "summary" field.

SECTIONS:
1. Patient Health Summary
2. Abnormal Findings
3. Disease/Condition Analysis
4. What Patient Should Do
5. What Patient Should Avoid
6. Food Recommendations (Indian Diet)
7. Exercise & Lifestyle
8. Risk Level
9. Hindi Voice Narration Script:
   - LENGTH: Keep it SHORT and CONCISE (Maximum 20-40 seconds, approx 3-4 sentences).
   - PERSONA: Ultra-soft, sweet, smooth female voice. Tone is calm, relaxing, and supportive.
   - STYLE: 100% natural daily Hindi conversation (Hinglish in Devanagari). Like two normal people talking softly.
   - CONTENT: Include ONLY (1) Main health issue, (2) Key abnormal values, (3) Simple food/lifestyle tip, (4) Calm supportive closing line.
   - PHRASING: Use ellipses (...) for natural pauses. "Aapke report me... isliye meetha kam khayiye. Tension lene ki zarurat nahi hai."

RULES:
- NO TRADITIONAL HINDI. NO SANSKRIT WORDS.
- NO FORMAL NEWS READER OR IVR TONE.
- NO MEDICINES.

OUTPUT: Return ONLY valid JSON.

JSON SCHEMA:
{
  "summary": "[Full 9-section interpretation]",
  "riskLevel": "Normal/Attention Needed/High Risk",
  "hindiVoiceScript": "[Short 30-sec Ultra-Soft Human Hindi Script]",
  "results": {
    "parameters": [
      {
        "name": "[Test]",
        "value": "[Value]",
        "unit": "[Unit]",
        "status": "Normal/Abnormal/Borderline",
        "insight": "[Simple explanation]"
      }
    ]
  }
}
`;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        logger.info(`Retrying detailed insight (Attempt ${attempt + 1}/${retries + 1})...`);
        // Wait slightly longer each time
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }

      const response = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: TEXT_MODEL,
        // On retries, or if we suspect JSON mode is failing, we can try without it
        response_format: attempt === retries ? undefined : { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in AI response');
      
      const parsed = attempt === retries ? robustParseJson(content) : JSON.parse(content);

      if (parsed && (parsed.summary || parsed.results)) {
        // Enforce string types to prevent React UI crashes
        if (parsed.summary && typeof parsed.summary !== 'string') {
          parsed.summary = Array.isArray(parsed.summary) ? parsed.summary.join('\n\n') : JSON.stringify(parsed.summary);
        }
        if (parsed.hindiVoiceScript && typeof parsed.hindiVoiceScript !== 'string') {
          parsed.hindiVoiceScript = Array.isArray(parsed.hindiVoiceScript) ? parsed.hindiVoiceScript.join(' ') : JSON.stringify(parsed.hindiVoiceScript);
        }
        return parsed;
      }
      throw new Error('Invalid or empty AI response structure');

    } catch (err) {
      lastErr = err;
      const msg = err?.message || (typeof err === 'string' ? err : 'Unknown');
      logger.warn(`Detailed Insight Attempt ${attempt + 1} failed: ${msg}`);
      
      if (err?.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  logger.error(`All attempts for detailed insight failed: ${lastErr.message}`);
  return {
    summary: 'Detailed analysis failed due to high traffic or connectivity issues. Please try refreshing in a moment.',
    findings: [],
    recommendation: 'Please consult your doctor for a professional interpretation.',
    risk_level: 'Medium',
    error: lastErr.message
  };
}

// =========================================
// OCR IMAGE ANALYSIS
// =========================================

function extractJsonObject(content = '') {
  // Try to extract the first complete JSON object from the response
  try {
    const match = String(content).match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : '{}');
  } catch {
    return {};
  }
}

async function extractPdfText(base64Data) {
  const pdfParse = require('pdf-parse');
  const raw = String(base64Data || '').startsWith('data:')
    ? String(base64Data).split(',')[1]
    : base64Data;
  const buffer = Buffer.from(raw, 'base64');
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

const REPORT_JSON_SCHEMA = `{
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
        "low": number | null,
        "high": number | null,
        "status": "Normal" | "Abnormal" | "Borderline",
        "insight": "Explain what this value means in simple language",
        "creativeSolution": "One specific food or habit to fix this",
        "suggestedMedicine": "None (Focus on diet)",
        "suggestedSpecialist": "Type of doctor to consult"
      }
    ],
    "medicines": []
  },
  "conditionAnalysis": {
    "detectedCondition": "Proper disease name",
    "severity": "Mild" | "Moderate" | "Serious",
    "explanation": "Simple explanation of causes and effects"
  },
  "patientGuidance": {
    "toDo": ["Action 1", "Action 2"],
    "toAvoid": ["Avoid 1", "Avoid 2"]
  },
  "dietRecommendations": {
    "helpfulFoods": ["Indian food 1", "Food 2"],
    "foodsToAvoid": ["Avoid 1", "Avoid 2"]
  },
  "lifestyleTips": ["Walking 30m", "Yoga", "Water intake", "Sleep 8h"],
  "summary": "[Generate a comprehensive 4-5 line summary in simple language explaining the detected condition, abnormal markers, and practical lifestyle/diet tips]",
  "riskLevel": "Normal" | "Attention Needed" | "High Risk",
  "hindiVoiceScript": "[Short 30-sec Ultra-Soft Human Hindi Script]"
}`;

function normalizeOcrResult(parsed = {}) {
  let safeSummary = parsed.summary || 'Medical report successfully analyzed.';
  if (typeof safeSummary !== 'string') {
    safeSummary = Array.isArray(safeSummary) ? safeSummary.join(' ') : JSON.stringify(safeSummary);
  }

  let safeVoice = parsed.hindiVoiceScript || '';
  if (typeof safeVoice !== 'string') {
    safeVoice = Array.isArray(safeVoice) ? safeVoice.join(' ') : JSON.stringify(safeVoice);
  }

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
    conditionAnalysis: parsed.conditionAnalysis || {},
    patientGuidance: parsed.patientGuidance || {},
    dietRecommendations: parsed.dietRecommendations || {},
    lifestyleTips: Array.isArray(parsed.lifestyleTips) ? parsed.lifestyleTips : [],
    summary: safeSummary,
    riskLevel: typeof parsed.riskLevel === 'string' ? parsed.riskLevel : 'Normal',
    hindiVoiceScript: safeVoice,
  };
}

async function analyzeReportImage(base64Image, mimeType = 'image/jpeg', retries = 1) {
  const client = getClient();
  if (!client) return normalizeOcrResult({ summary: 'AI not configured.' });

  const ocrInstructions = `Extract all medical data. For the "summary" field, YOU MUST write a comprehensive 4-5 line summary in simple human language explaining the condition, abnormal values, and specific lifestyle/diet tips. Strictly NO medicines. Return ONLY valid JSON matching this schema:\n${REPORT_JSON_SCHEMA}`;

  if (mimeType === 'application/pdf') {
    try {
      const pdfText = await extractPdfText(base64Image);
      if (pdfText && pdfText.length > 30) {
        const prompt = `${ocrInstructions}\n\nText:\n${pdfText.slice(0, 14000)}`;
        const response = await client.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: TEXT_MODEL,
          response_format: { type: 'json_object' },
        });
        return normalizeOcrResult(robustParseJson(response.choices[0]?.message?.content));
      }
    } catch (err) { logger.error(`PDF OCR failed: ${err?.message || err}`); }
  }

  const cleanBase64 = String(base64Image || '').startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
  const visionModels = [
    'meta-llama/llama-4-scout-17b-16e-instruct', 
    'groq/compound'
  ];
  let lastErr;

  for (const model of visionModels) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await client.chat.completions.create({
          messages: [{ role: 'user', content: [{ type: 'text', text: ocrInstructions }, { type: 'image_url', image_url: { url: cleanBase64 } }] }],
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });
        const content = response.choices[0]?.message?.content || '{}';
        const parsed = robustParseJson(content);
        if (parsed && (parsed.results || parsed.summary)) return normalizeOcrResult(parsed);
      } catch (err) { 
        lastErr = err; 
        const status = err?.status || err?.response?.status;
        if (status === 429) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1))); 
        } else {
          break; // Try next model immediately
        }
      }
    }
  }
  const finalError = lastErr?.message || lastErr || 'OCR failed';
  logger.error(`OCR Vision final failure: ${finalError}`);
  return normalizeOcrResult({ summary: `Vision failed: ${finalError}` });
}

// =========================================
// HINDI TRANSLATION
// =========================================

async function translateTextToHindi(text, retries = 1) {
  const source = String(text || '').trim();
  if (!source) return '';

  // If text contains Devanagari characters, assume it's already Hindi and return it
  if (/[\u0900-\u097F]/.test(source)) {
    return source;
  }

  const client = getClient();
  if (!client) return source;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await client.chat.completions.create({
        messages: [{ role: 'user', content: `
Translate the following medical summary into natural, smooth, and friendly PURE HINDI.

Rules:
1. VOICE: Sound like a kind, smooth-voiced female health assistant (Humen girl voice). Tone should be like a caring daughter or sister.
2. NO ENGLISH WORDS: This is CRITICAL. Do NOT use ANY English words. 
   - Instead of "Medicine", use "Dawai" or "Aushadhi".
   - Instead of "Doctor", use "Chikitsak" or "Vaidya" (or simply 'Doctor' in Hindi script if very common).
   - Instead of "Hyperlipidemia", use "Shareer mein vasa ki badhauti".
   - Instead of "Diet", use "Khan-pan" or "Aahar".
   - Instead of "Exercise", use "Vyayam" or "Kasrat".
   - Instead of "Result/Report", use "Jaanch" or "Parinaam".
3. CONTENT: 
   - Start by identifying the condition in simple Hindi.
   - Give 3 clear Food tips (Kya khaayein).
   - Give 3 clear Exercise tips (Kaun sa vyayam karein).
   - List 2-3 Do's and Don'ts (Kya karein aur kya na karein).
4. NO MEDICINE NAMES: Strictly avoid mentioning any tablet or drug names.
5. SCRIPT: Use ONLY Devanagari script.

Text: ${source}` }],
        model: TEXT_MODEL,
        temperature: 0.2,
      });
      return String(response?.choices?.[0]?.message?.content || '').trim() || source;
    } catch (err) { 
      if (err?.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, 1000)); 
      } else { 
        logger.error(`Hindi fail: ${err?.message || err || 'Unknown'}`); 
        return source; 
      } 
    }
  }
}

module.exports = {
  generateInsight,
  generateDetailedInsight,
  analyzeReportImage,
  translateTextToHindi,
};
