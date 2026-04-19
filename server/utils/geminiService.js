const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialization will happen inside the analysis function to ensure process.env is ready
const DEFAULT_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash';

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
    return null;
  }
}

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
    'gemini-2.0-flash',
    'gemini-3.1-flash-preview',
    'gemini-2.5-pro',
    'gemini-flash-latest'
  ].filter(Boolean);

  let lastError = null;

  for (const modelName of MODELS_TO_TRY) {
    const maxRetries = 1; 
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
        
        if (!apiKey || !apiKey.startsWith('AIza')) {
          // ... (keep mock mode logic same as before)
          console.warn('[Gemini Service] Invalid or missing API Key. Entering Mock Mode.');
          await new Promise(r => setTimeout(r, 2000));
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
        const is404 = msg.includes('404') || msg.includes('not found') || msg.includes('not supported');
        const isBusy = msg.includes('503') || msg.includes('429') || msg.includes('demand') || msg.includes('load');

        if (is404) {
          console.warn(`[Gemini] Model ${modelName} unavailable. Skipping...`);
          break; 
        }

        if (isBusy && retryCount < maxRetries) {
          retryCount++;
          const waitTime = retryCount * 2000;
          console.warn(`[Gemini] ${modelName} busy. Retrying in ${waitTime}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        console.error(`[Gemini Error - ${modelName}]:`, error.message);
        break; 
      }
    }
  }

  throw new Error(`AI analysis failed. Last error: ${lastError?.message}`);
}

/**
 * Handles conversational chat about a medical report.
 */
async function chatAboutReport(userMessage, reportData, history = []) {
  try {
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

    const result = await chat.sendMessage(contextPrompt);
    return result.response.text();
  } catch (error) {
    console.error('[Gemini Chat Error]:', error);
    throw error;
  }
}

module.exports = { analyzeMedicalReport, chatAboutReport };
