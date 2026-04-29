const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
const { createClient } = require('@supabase/supabase-js');
const { sendEmail, sendWelcomeEmail, sendReportReadyEmail } = require('./utils/emailService');
const {
  analyzeMedicalReport,
  analyzeMedicalText,
  extractMedicalText,
  chatAboutReport
} = require('./utils/geminiService');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../client/.env.local') });

// Startup Diagnostic
const groqKey = process.env.GROQ_API_KEY;
const ocrKey = process.env.OCR_SPACE_API_KEY;

if (groqKey) {
  console.log('[AI] Groq Intelligence Engine Active (Llama-3.3-70B)');
} else {
  console.warn('[AI Warning] No GROQ_API_KEY found in .env. Report analysis will fail.');
}

if (ocrKey) {
  console.log('[OCR] Space Engine Active (Engine 2 + Table Mode)');
} else {
  console.warn('[OCR Warning] No OCR_SPACE_API_KEY found in .env. Document reading will fail.');
=======
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail, sendWelcomeEmail, sendReportReadyEmail } = require('./utils/emailService');
const { analyzeMedicalReport, chatAboutReport } = require('./utils/geminiService');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../client/.env.local') });
dotenv.config();

// Startup Diagnostic
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const defaultGeminiModel = process.env.GOOGLE_GEMINI_MODEL || 'gemini-flash-latest';
if (apiKey) {
  const masked = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`[Gemini] System initialized with API Key: ${masked}`);
  console.log(`[Gemini] Default model: ${defaultGeminiModel}`);
  if (!apiKey.startsWith('AIza')) {
    console.error('[Gemini Warning] API Key format looks invalid. It should start with "AIza".');
  }
} else {
  console.error('[Gemini Error] No API Key found in environment variables!');
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
}

const app = express();
const port = Number(process.env.PORT) || 3002;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
<<<<<<< HEAD
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
=======
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
const allowedRoles = new Set(['patient', 'staff', 'admin', 'doctor']);
<<<<<<< HEAD
const allowedAnalysisSpeeds = new Set(['fast', 'balanced', 'thorough']);
const PROFILE_TABLES = ['patients', 'patient'];

function isMissingTableError(error) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    String(error.message || '').toLowerCase().includes('could not find the table')
  );
}

function normalizeProfile(row) {
  if (!row) return null;
  return {
    ...row,
    dob: row.dob ?? row.date_of_birth ?? '',
    date_of_birth: row.date_of_birth ?? row.dob ?? '',
  };
}

function resolveAnalysisSpeed(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (allowedAnalysisSpeeds.has(normalized)) return normalized;
  const envMode = String(process.env.AI_ANALYSIS_SPEED || process.env.AI_ANALYSIS_MODE || '').trim().toLowerCase();
  if (allowedAnalysisSpeeds.has(envMode)) return envMode;
  return 'fast';
}

function estimateBase64Bytes(data) {
  const raw = String(data || '');
  const clean = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
  if (!clean) return 0;
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
}

function speedRank(speed) {
  if (speed === 'thorough') return 3;
  if (speed === 'balanced') return 2;
  return 1;
}

function maxSpeed(a, b) {
  return speedRank(a) >= speedRank(b) ? a : b;
}

function resolveAdaptiveAnalysisSpeed(requestedSpeed, mimeType, imagePayload) {
  const requested = resolveAnalysisSpeed(requestedSpeed);
  const normalizedMime = String(mimeType || '').toLowerCase();
  const sizeBytes = estimateBase64Bytes(imagePayload);
  const isPdf = normalizedMime.includes('pdf');

  let recommended = 'fast';
  if (isPdf) {
    if (sizeBytes >= 5000 * 1024) recommended = 'thorough';
    else recommended = 'balanced';
  } else if (sizeBytes >= 8 * 1024 * 1024) {
    recommended = 'thorough';
  } else if (sizeBytes >= 4 * 1024 * 1024) {
    recommended = 'balanced';
  }

  return {
    speedMode: maxSpeed(requested, recommended),
    sizeBytes,
  };
}

function buildApiFallbackAnalysis(reason = 'quota', retryAfterSec = null) {
  const retryText = retryAfterSec
    ? `Please retry in about ${Math.max(1, Math.ceil(Number(retryAfterSec)))} seconds.`
    : 'Please retry shortly.';
  const reasonText =
    reason === 'busy'
      ? 'AI service is under heavy load right now.'
      : reason === 'auth'
      ? 'AI API key is invalid or expired.'
      : 'AI quota is temporarily exhausted.';

  return {
    type: 'Other',
    labDetails: { name: 'LabIntel Fallback Mode', address: '', contact: '' },
    patientInfo: {
      name: 'Valued Patient',
      age: '',
      gender: '',
      date: new Date().toLocaleDateString(),
      doctor: '',
    },
    results: {
      parameters: [],
      medicines: [],
    },
    summary: `${reasonText} Returning a temporary fallback report so your workflow continues.`,
    comprehensiveReport:
      'Live AI analysis is currently unavailable due to quota/capacity limits. This fallback keeps the scan flow non-blocking.',
    advice: [
      retryText,
      'Add a secondary AI key in server/.env to improve failover.',
      'Do not use fallback output as final clinical interpretation.',
    ],
    riskLevel: 'Medium',
    quality: {
      extractionMode: 'quota-fallback',
      analysisSpeed: 'fallback',
      coveragePercent: 0,
      fallbackReason: reason,
      retryAfterSec: retryAfterSec || null,
    },
  };
}
=======
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64

if (!hasSupabaseConfig) {
  console.warn('Supabase env values are missing. API endpoints that require DB will return setup errors.');
}

<<<<<<< HEAD
const serverDbKey = supabaseServiceKey || supabaseAnonKey;
const serverSupabase = hasSupabaseConfig ? createClient(supabaseUrl, serverDbKey) : null;

if (hasSupabaseConfig && !supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_KEY is missing; backend reads may be limited by RLS policies.');
=======
const serverSupabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;

function getGeminiModel() {
  const key = process.env.GOOGLE_GEMINI_API_KEY || '';
  if (!key || !key.startsWith('AIza')) return null;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: defaultGeminiModel });
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

function bearerToken(req) {
  const value = req.headers.authorization || '';
  if (!value.toLowerCase().startsWith('bearer ')) return '';
  return value.slice(7).trim();
}

function authedClient(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

async function requireAuth(req, res, next) {
  if (!hasSupabaseConfig) {
    res.status(500).json({ error: 'Supabase is not configured on the server.' });
    return;
  }

  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token.' });
    return;
  }

  const client = authedClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }

  req.supabase = client;
  req.authUser = data.user;
  next();
}

app.get('/health', async (req, res) => {
  if (!hasSupabaseConfig) {
    res.status(500).json({
      status: 'degraded',
      port,
      supabaseConfigured: false,
      db: 'unavailable',
      message: 'Missing Supabase env values.',
    });
    return;
  }

  try {
<<<<<<< HEAD
    let connected = false;
    let lastError = null;
    for (const table of PROFILE_TABLES) {
      const { error } = await serverSupabase.from(table).select('id', { head: true, count: 'exact' }).limit(1);
      if (!error) {
        connected = true;
        break;
      }
      if (!isMissingTableError(error)) {
        lastError = error;
        break;
      }
      lastError = error;
    }
    if (!connected && lastError) throw lastError;

=======
    const { error } = await serverSupabase.from('patient').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) throw error;
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
    res.json({
      status: 'ok',
      port,
      supabaseConfigured: true,
      db: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      port,
      supabaseConfigured: true,
      db: 'error',
      message: error.message,
    });
  }
});

app.get('/api/auth/profile', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    let profile = null;
    let lastError = null;

    for (const table of PROFILE_TABLES) {
      const { data, error } = await req.supabase
        .from(table)
        .select('*')
        .eq('id', req.authUser.id)
        .maybeSingle();
      if (!error) {
        profile = normalizeProfile(data);
        break;
      }
      if (!isMissingTableError(error)) throw error;
      lastError = error;
    }

    if (!profile && lastError && !isMissingTableError(lastError)) {
      throw lastError;
    }

    res.json(profile || null);
=======
    const { data, error } = await req.supabase
      .from('patient')
      .select('*')
      .eq('id', req.authUser.id)
      .maybeSingle();
    if (error) throw error;
    res.json(data || null);
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const roleCandidate = String(req.body?.role || '').toLowerCase();
    const role = allowedRoles.has(roleCandidate) ? roleCandidate : 'patient';
<<<<<<< HEAD
    const fullName = String(req.body?.full_name || req.body?.name || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const dob = String(req.body?.dob || req.body?.date_of_birth || '').trim();
    const payloadByTable = {
      patients: {
        id: req.authUser.id,
        full_name: fullName,
        phone,
        date_of_birth: dob || null,
      },
      patient: {
        id: req.authUser.id,
        role,
        full_name: fullName,
        phone,
        dob: dob || null,
        avatar_url: req.body?.avatar_url || null,
      },
    };

    let data = null;
    let writeSucceeded = false;
    let lastError = null;
    for (const table of PROFILE_TABLES) {
      let payload = { ...payloadByTable[table] };
      let result = await req.supabase
        .from(table)
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (result.error && table === 'patient' && (result.error.code === '42703' || result.error.message?.includes('avatar_url'))) {
        const withoutAvatar = { ...payload };
        delete withoutAvatar.avatar_url;
        result = await req.supabase
          .from(table)
          .upsert(withoutAvatar, { onConflict: 'id' })
          .select()
          .single();
      }

      if (!result.error) {
        data = normalizeProfile(result.data);
        writeSucceeded = true;
        break;
      }

      if (!isMissingTableError(result.error)) throw result.error;
      lastError = result.error;
    }

    if (!writeSucceeded) {
      throw lastError || new Error('No compatible profile table found (expected "patients" or "patient").');
    }
=======
    const payload = {
      id: req.authUser.id,
      role,
      full_name: String(req.body?.full_name || req.body?.name || '').trim(),
      phone: String(req.body?.phone || '').trim(),
      dob: String(req.body?.dob || '').trim(),
      avatar_url: req.body?.avatar_url || null,
    };

    let { data, error } = await req.supabase
      .from('patient')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    // Fallback: If avatar_url column doesn't exist yet, retry without it
    if (error && (error.code === '42703' || error.message?.includes('avatar_url'))) {
      console.warn('⚠️ avatar_url column missing from DB. Retrying without it...');
      const savedPayload = { ...payload };
      delete savedPayload.avatar_url;
      
      const retry = await req.supabase
        .from('patient')
        .upsert(savedPayload, { onConflict: 'id' })
        .select()
        .single();
        
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64

    // --- NEW: Automate Welcome Email ---
    if (role === 'patient') {
      console.log(`Attempting to send welcome email to ${req.authUser.email}...`);
      try {
        const info = await sendWelcomeEmail({
          name: data.full_name || 'Valued Patient',
          email: req.authUser.email
        });
        console.log(`✅ Welcome email sent successfully: ${info.messageId}`);
      } catch (emailErr) {
        console.error('❌ Failed to send welcome email:', emailErr.message);
      }
    }
    // ------------------------------------

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const role = String(req.authUser?.user_metadata?.role || 'patient').toLowerCase();
    const isPatient = role === 'patient';
    const requestedPatientId = String(req.query.patient_id || '').trim();

    let query = serverSupabase
      .from('reports')
      .select('*, test_panels(name, short_code)')
      .order('created_at', { ascending: false });

    if (isPatient) {
      query = query.eq('patient_id', req.authUser.id);
    } else if (requestedPatientId) {
      query = query.eq('patient_id', requestedPatientId);
    }

=======
    let query = req.supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (req.query.patient_id) {
      query = query.eq('patient_id', req.query.patient_id);
    }
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports', requireAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      created_by: req.authUser.id,
    };
    const { data, error } = await req.supabase.from('reports').insert([payload]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/reports/:id/status', requireAuth, async (req, res) => {
  try {
    const status = String(req.body?.status || '').trim();
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const { data: updatedReport, error: updateError } = await req.supabase
      .from('reports')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // --- NEW: Automate Email Notification ---
    if (status.toLowerCase() === 'ready' || status.toLowerCase() === 'completed') {
      console.log(`Report status updated to ${status}. Triggering notification for patient...`);
      try {
<<<<<<< HEAD
        let patientName = 'Patient';
        let patientEmail = '';

        for (const table of PROFILE_TABLES) {
          const selectColumns = table === 'patients' ? 'full_name' : 'full_name, email';
          const { data: patient, error: patientError } = await req.supabase
            .from(table)
            .select(selectColumns)
            .eq('id', updatedReport.patient_id)
            .maybeSingle();

          if (patientError) {
            if (isMissingTableError(patientError)) continue;
            console.error('❌ Could not fetch patient data for notification:', patientError.message);
            break;
          }

          if (patient?.full_name) patientName = patient.full_name;
          if (patient?.email) patientEmail = patient.email;
          break;
        }

        if (patientEmail) {
          console.log(`Sending report-ready email to ${patientEmail}...`);
          const info = await sendReportReadyEmail({
            name: patientName,
            email: patientEmail,
=======
        // Fetch patient details to get their name/email
        const { data: patient, error: patientError } = await req.supabase
          .from('patient')
          .select('full_name, email')
          .eq('id', updatedReport.patient_id)
          .maybeSingle();

        if (patientError) {
          console.error('❌ Could not fetch patient data for notification:', patientError.message);
        } else if (patient?.email) {
          console.log(`Sending report-ready email to ${patient.email}...`);
          const info = await sendReportReadyEmail({
            name: patient.full_name || 'Patient',
            email: patient.email,
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
            reportId: updatedReport.id
          });
          console.log(`✅ Notification email sent: ${info.messageId}`);
        } else {
<<<<<<< HEAD
          console.warn('⚠️ No email available in profile table for this patient, skipping notification.');
=======
          console.warn('⚠️ No email found for patient, skipping notification.');
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
        }
      } catch (emailErr) {
        console.error('❌ Failed to send automated notification email:', emailErr.message);
        // We don't fail the request if just the email fails
      }
    }
    // ----------------------------------------

    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── AI ANALYSIS ─────────────────────────────────────────────────────────────

app.post('/api/analyze-report', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const { image, mimeType, patientId, analysisSpeed } = req.body;
    console.log(`[AI] Request: Patient=${patientId}, Speed=${analysisSpeed}, Mime=${mimeType}`);

    if (!image) {
      console.warn('[AI] Rejecting: Missing image data');
      return res.status(400).json({ error: 'Image data is required' });
    }
    const { speedMode, sizeBytes } = resolveAdaptiveAnalysisSpeed(analysisSpeed, mimeType, image);
=======
    const { image, mimeType, patientId } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64

    // Strip base64 prefix if present (e.g., "data:image/jpeg;base64,")

    // Fetch previous report for comparative analysis
    let previousData = null;
    if (patientId && serverSupabase) {
      const { data: reports } = await serverSupabase
        .from('reports')
        .select('results, date, test_name')
        .eq('patient_id', patientId)
        .eq('status', 'Ready')
        .order('date', { ascending: false })
        .limit(1);
      
      if (reports && reports.length > 0) {
        previousData = reports[0];
      }
    }

    // Clean the base64 string
    const cleanImage = image.includes('base64,') ? image.split('base64,')[1] : image;

<<<<<<< HEAD
    console.log('[API] Starting analysis for patient:', patientId, 'speed:', speedMode, 'sizeBytes:', sizeBytes);
    const analysis = await analyzeMedicalReport(cleanImage, mimeType || 'image/jpeg', previousData, {
      speedMode,
    });
=======
    console.log('[API] Starting analysis for patient:', patientId);
    const analysis = await analyzeMedicalReport(cleanImage, mimeType || 'image/jpeg', previousData);
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
    console.log('[API] Analysis successful');
    res.json(analysis);
  } catch (error) {
    console.error('[Analyze API Error]:', error);
<<<<<<< HEAD

    const rawMsg = String(error?.message || '');
    const msg = rawMsg.toLowerCase();
    const isHighDemand =
      msg.includes('503') ||
      msg.includes('high demand') ||
      msg.includes('overloaded') ||
      msg.includes('service unavailable');
    const isQuota =
      msg.includes('429') ||
      msg.includes('too many requests') ||
      msg.includes('quota') ||
      msg.includes('rate limit');
    const isAuthKey =
      msg.includes('api key expired') ||
      msg.includes('invalid api key') ||
      msg.includes('api key not valid') ||
      msg.includes('unauthenticated') ||
      msg.includes('permission denied');

    let retryAfterSec = null;
    const retryTextMatch = rawMsg.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
    if (retryTextMatch) {
      retryAfterSec = Math.max(1, Math.ceil(Number(retryTextMatch[1])));
    }
    const retryJsonMatch = rawMsg.match(/"retryDelay":"(\d+)s"/i);
    if (!retryAfterSec && retryJsonMatch) {
      retryAfterSec = Math.max(1, Number(retryJsonMatch[1]));
    }

    const status = isQuota ? 429 : isHighDemand ? 503 : 500;
    const code = isQuota ? 'AI_QUOTA_EXCEEDED' : isHighDemand ? 'AI_BUSY' : 'AI_ANALYSIS_FAILED';
    const errorText = isQuota
      ? 'AI quota limit reached for now.'
      : isHighDemand
      ? 'AI is currently under heavy load.'
      : 'AI analysis failed.';
    const suggestion = isQuota
      ? 'Please wait and retry shortly, or switch to a model/project with available quota.'
      : isHighDemand
      ? 'The AI is processing many requests. Please retry in a few seconds.'
      : 'Please try again with a clearer file or check AI configuration.';

    // DISABLED demo fallback to show raw errors
    /*
    if (isQuota || isHighDemand || isAuthKey) {
      const reason = isAuthKey ? 'auth' : isHighDemand ? 'busy' : 'quota';
      const fallback = buildApiFallbackAnalysis(reason, retryAfterSec);
      return res.status(200).json(fallback);
    }
    */
    
    // If it's a real failure, show the specific error so we can fix it
    return res.status(status).json({ 
      error: errorText, 
      code, 
      suggestion: `Details: ${error.message}`
=======
    
    // Check for specific 503/high-demand error
    const isHighDemand = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('overloaded');
    
    res.status(isHighDemand ? 503 : 500).json({ 
      error: isHighDemand ? 'AI is currently under heavy load.' : 'AI analysis failed.', 
      details: error.message,
      suggestion: isHighDemand ? 'The AI is currently processing many requests. Please wait a few seconds and try again.' : 'Please try again with a clearer image or check your API configuration.'
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
    });
  }
});

<<<<<<< HEAD
/**
 * POST /api/chat-report
 * Interactive chat about a specific medical report.
 */
app.post('/api/chat-report', requireAuth, async (req, res) => {
  try {
    const { message, reportData, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    console.log('[Chat API] Processing question for report...');
    const result = await chatAboutReport(message, reportData, history || []);
    res.json({ response: result });
  } catch (error) {
    console.error('[Chat API Error]:', error.message);
    res.status(500).json({ error: 'Failed to generate chat response.' });
  }
});

=======
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
// ── OCR & AI PIPELINE ────────────────────────────────────────────────────────

/**
 * POST /api/scan-ocr
 * Extracts raw text from an image/document.
 */
app.post('/api/scan-ocr', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const { image, mimeType, analysisSpeed } = req.body;
    if (!image) return res.status(400).json({ error: 'Image data is required' });
    const { speedMode } = resolveAdaptiveAnalysisSpeed(analysisSpeed, mimeType, image);

    const cleanImage = image.includes('base64,') ? image.split('base64,')[1] : image;
    const ocr = await extractMedicalText(cleanImage, mimeType || 'image/jpeg', { speedMode });
    res.json({
      text: ocr.text || '',
      markers: Array.isArray(ocr.markers) ? ocr.markers : [],
      medicines: Array.isArray(ocr.medicines) ? ocr.medicines : [],
      detectedType: ocr.detectedType || 'Other',
      header: ocr.header || {},
      lines: Array.isArray(ocr.lines) ? ocr.lines : [],
    });
=======
    const { image, mimeType } = req.body;
    if (!image) return res.status(400).json({ error: 'Image data is required' });

    const cleanImage = image.includes('base64,') ? image.split('base64,')[1] : image;
    const model = getGeminiModel();
    if (!model) {
      return res.status(500).json({ error: 'Gemini API key is missing or invalid on server.' });
    }
    
    const result = await model.generateContent([
      "Extract all text from this medical document exactly as it appears. Return only the raw text.",
      { inlineData: { data: cleanImage, mimeType: mimeType || 'image/jpeg' } }
    ]);
    
    const text = result.response.text();
    res.json({ text });
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
  } catch (error) {
    console.error('[OCR Scan Error]:', error.message);
    res.status(500).json({ error: 'OCR extraction failed.' });
  }
});

/**
 * POST /api/generate-ai-report
 * Classifies text and transforms it into a structured modern report.
 * (Legacy support for text-only analysis, now uses the unified service)
 */
app.post('/api/generate-ai-report', requireAuth, async (req, res) => {
  try {
<<<<<<< HEAD
    const { text, analysisSpeed } = req.body;
    if (!text) return res.status(400).json({ error: 'Text content is required' });
    const speedMode = resolveAnalysisSpeed(analysisSpeed);
    const analysis = await analyzeMedicalText(text, null, { speedMode });
    res.json(analysis);
=======
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text content is required' });
    const model = getGeminiModel();
    if (!model) {
      return res.status(500).json({ error: 'Gemini API key is missing or invalid on server.' });
    }

    // For "top-notch" results, we recommend using the image-based /api/analyze-report
    // but we support text-based conversion here by wrapping it in a simple prompt
    const result = await model.generateContent(`
      Transform this medical text into our standard structured JSON:
      "${text}"
      
      JSON STRUCTURE:
      {
        "type": "Lab Report | Prescription | Other",
        "results": { ... },
        "summary": "...",
        "advice": ["...", "..."],
        "riskLevel": "Low | Medium | High"
      }
    `);
    
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI returned invalid JSON format.' });
    }
    res.json(JSON.parse(jsonMatch[0]));
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
  } catch (error) {
    console.error('[AI Generation Error]:', error.message);
    res.status(500).json({ error: 'AI transformation failed.' });
  }
});

// ── SMTP / Email routes ──────────────────────────────────────────────────────

/**
 * POST /api/test-email
 * Quick connectivity test. Sends a plain test email to the given address.
 * Body: { "to": "recipient@example.com" }
 */
app.post('/api/test-email', async (req, res) => {
  const to = String(req.body?.to || '').trim();
  if (!to) {
    res.status(400).json({ error: '"to" email address is required.' });
    return;
  }

  try {
    const info = await sendEmail({
      to,
      subject: 'LabIntel SMTP Test ✅',
      html: '<p>SMTP is working correctly on your <strong>LabIntel</strong> server. 🎉</p>',
    });
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[SMTP test-email error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/welcome
 * Send a welcome email. Protected route.
 * Body: { "name": "...", "email": "..." }
 */
app.post('/api/email/welcome', requireAuth, async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    res.status(400).json({ error: '"name" and "email" are required.' });
    return;
  }

  try {
    const info = await sendWelcomeEmail({ name, email });
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[SMTP welcome error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/report-ready
 * Notify a patient that their report is ready. Protected route.
 * Body: { "name": "...", "email": "...", "reportId": "..." }
 */
app.post('/api/email/report-ready', requireAuth, async (req, res) => {
  const { name, email, reportId } = req.body || {};
  if (!name || !email || !reportId) {
    res.status(400).json({ error: '"name", "email", and "reportId" are required.' });
    return;
  }

  try {
    const info = await sendReportReadyEmail({ name, email, reportId });
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[SMTP report-ready error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

<<<<<<< HEAD
const server = app.listen(port, () => {
  console.log(`LabIntel Server: http://localhost:${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[FATAL ERROR] Port ${port} is already in use.`);
    console.error(`This usually happens if a previous server instance is still running.`);
    console.error(`FIX: Run 'taskkill /F /IM node.exe' or change PORT in .env\n`);
    process.exit(1);
  } else {
    console.error('[Server Error]', err);
  }
=======
app.listen(port, () => {
  console.log(`LabIntel Server: http://localhost:${port}`);
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
});
