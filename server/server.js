const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
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
}

const app = express();
const port = Number(process.env.PORT) || 3002;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
const allowedRoles = new Set(['patient', 'staff', 'admin', 'doctor']);

if (!hasSupabaseConfig) {
  console.warn('Supabase env values are missing. API endpoints that require DB will return setup errors.');
}

const serverSupabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;

function getGeminiModel() {
  const key = process.env.GOOGLE_GEMINI_API_KEY || '';
  if (!key || !key.startsWith('AIza')) return null;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: defaultGeminiModel });
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
    const { error } = await serverSupabase.from('patient').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) throw error;
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
    const { data, error } = await req.supabase
      .from('patient')
      .select('*')
      .eq('id', req.authUser.id)
      .maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const roleCandidate = String(req.body?.role || '').toLowerCase();
    const role = allowedRoles.has(roleCandidate) ? roleCandidate : 'patient';
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
    let query = req.supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (req.query.patient_id) {
      query = query.eq('patient_id', req.query.patient_id);
    }
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
            reportId: updatedReport.id
          });
          console.log(`✅ Notification email sent: ${info.messageId}`);
        } else {
          console.warn('⚠️ No email found for patient, skipping notification.');
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
    const { image, mimeType, patientId } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

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

    console.log('[API] Starting analysis for patient:', patientId);
    const analysis = await analyzeMedicalReport(cleanImage, mimeType || 'image/jpeg', previousData);
    console.log('[API] Analysis successful');
    res.json(analysis);
  } catch (error) {
    console.error('[Analyze API Error]:', error);
    
    // Check for specific 503/high-demand error
    const isHighDemand = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('overloaded');
    
    res.status(isHighDemand ? 503 : 500).json({ 
      error: isHighDemand ? 'AI is currently under heavy load.' : 'AI analysis failed.', 
      details: error.message,
      suggestion: isHighDemand ? 'The AI is currently processing many requests. Please wait a few seconds and try again.' : 'Please try again with a clearer image or check your API configuration.'
    });
  }
});

// ── OCR & AI PIPELINE ────────────────────────────────────────────────────────

/**
 * POST /api/scan-ocr
 * Extracts raw text from an image/document.
 */
app.post('/api/scan-ocr', requireAuth, async (req, res) => {
  try {
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

app.listen(port, () => {
  console.log(`LabIntel Server: http://localhost:${port}`);
});
