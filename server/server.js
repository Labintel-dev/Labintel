const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

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
    const { error } = await serverSupabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
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
      .from('profiles')
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
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
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

    const { data, error } = await req.supabase
      .from('reports')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`LabIntel Server: http://localhost:${port}`);
});
