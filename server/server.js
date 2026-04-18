const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail, sendWelcomeEmail, sendReportReadyEmail } = require('./utils/emailService');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../client/.env.local') });
dotenv.config();

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

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

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
    };

    const { data, error } = await req.supabase
      .from('patient')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

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
