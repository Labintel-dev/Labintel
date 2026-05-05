import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './db/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Fallback mock data (used when Supabase is not configured) ──
const MOCK = {
  labs: [
    { id: '1', name: 'Apollo Diagnostics', code: 'AP', subdomain: 'apollolab.labintel.in', status: 'ACTIVE', patients_count: 1204, reports_count: 342, live_now: 34, avatar_color: '#6366f1' },
    { id: '2', name: 'Sunrise Diagnostics', code: 'SR', subdomain: 'sunrise.labintel.in', status: 'ACTIVE', patients_count: 870, reports_count: 215, live_now: 22, avatar_color: '#f59e0b' },
    { id: '3', name: 'City Lab Mumbai', code: 'CL', subdomain: 'citylab.labintel.in', status: 'TRIAL', patients_count: 430, reports_count: 98, live_now: 16, avatar_color: '#10b981' },
    { id: '4', name: 'NovaCare Labs', code: 'NL', subdomain: 'novacare.labintel.in', status: 'INACTIVE', patients_count: 120, reports_count: 44, live_now: 0, avatar_color: '#ef4444' },
    { id: '5', name: 'MedCare Pathology', code: 'MP', subdomain: 'medcare.labintel.in', status: 'ACTIVE', patients_count: 654, reports_count: 189, live_now: 18, avatar_color: '#8b5cf6' },
    { id: '6', name: 'HealthFirst Labs', code: 'HF', subdomain: 'healthfirst.labintel.in', status: 'ACTIVE', patients_count: 310, reports_count: 76, live_now: 7, avatar_color: '#ec4899' },
    { id: '7', name: 'DiagnoPlus', code: 'DP', subdomain: 'diagnoplus.labintel.in', status: 'ACTIVE', patients_count: 198, reports_count: 55, live_now: 9, avatar_color: '#14b8a6' },
    { id: '8', name: 'PrimeLab India', code: 'PL', subdomain: 'primelab.labintel.in', status: 'ACTIVE', patients_count: 35, reports_count: 12, live_now: 3, avatar_color: '#f97316' },
  ],
  team: [
    { id: '1', name: 'Rahul Agarwal', initials: 'RA', role: 'LEAD DEV', assigned_lab: 'All Labs', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#6366f1', is_owner: true },
    { id: '2', name: 'Priya Sharma', initials: 'PS', role: 'DEVELOPER', assigned_lab: 'Apollo, Sunrise', reports_this_month: 128, status: 'ACTIVE', avatar_color: '#ec4899' },
    { id: '3', name: 'Arjun Kumar', initials: 'AK', role: 'DESIGNER', assigned_lab: 'All Labs (UI)', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#f59e0b' },
    { id: '4', name: 'Neha Patil', initials: 'NP', role: 'DEVELOPER', assigned_lab: 'CityLab, MedCare', reports_this_month: 74, status: 'ACTIVE', avatar_color: '#ef4444' },
    { id: '5', name: 'Vikram Mehta', initials: 'VM', role: 'DEVELOPER', assigned_lab: 'HealthFirst', reports_this_month: 51, status: 'ON LEAVE', avatar_color: '#10b981' },
    { id: '6', name: 'Sneha Rao', initials: 'SR', role: 'QA ENGINEER', assigned_lab: 'All Labs', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#8b5cf6' },
    { id: '7', name: 'Amit Desai', initials: 'AD', role: 'BACKEND DEV', assigned_lab: 'Apollo, NovaCare', reports_this_month: 96, status: 'ACTIVE', avatar_color: '#06b6d4' },
    { id: '8', name: 'Kavita Joshi', initials: 'KJ', role: 'DATA ANALYST', assigned_lab: 'All Labs', reports_this_month: 203, status: 'ACTIVE', avatar_color: '#f97316' },
    { id: '9', name: 'Rohan Gupta', initials: 'RG', role: 'DEVOPS', assigned_lab: 'Infrastructure', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#14b8a6' },
    { id: '10', name: 'Meera Nair', initials: 'MN', role: 'SUPPORT', assigned_lab: 'All Labs', reports_this_month: 45, status: 'ACTIVE', avatar_color: '#a855f7' },
  ],
  activity: [
    { id: '1', message: 'Apollo released 12 reports', type: 'success', lab_name: 'Apollo', time: '2 min ago' },
    { id: '2', message: 'New lab HealthFirst onboarded', type: 'info', lab_name: 'HealthFirst', time: '18 min ago' },
    { id: '3', message: 'Alert engine: 3 critical values at Sunrise', type: 'warning', lab_name: 'Sunrise', time: '1 hr ago' },
    { id: '4', message: 'NovaCare deactivated by Rahul', type: 'error', lab_name: 'NovaCare', time: '3 hrs ago' },
    { id: '5', message: 'Priya added as Tech at CityLab', type: 'info', lab_name: 'CityLab', time: '5 hrs ago' },
    { id: '6', message: 'PDF generation: 34 PDFs queued Apollo', type: 'info', lab_name: 'Apollo', time: '7 hrs ago' },
    { id: '7', message: 'Daily backup completed — all labs', type: 'success', lab_name: null, time: 'Last night 11 PM' },
  ],
};

const isSupabaseConfigured = () => {
  return process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project');
};

// ── Stats ──
app.get('/api/stats', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data: labs } = await supabase.from('labs').select('*');
      const activeLabs = labs?.filter(l => l.status === 'ACTIVE').length || 0;
      const totalPatients = labs?.reduce((s, l) => s + (l.patients_count || 0), 0) || 0;
      const totalReports = labs?.reduce((s, l) => s + (l.reports_count || 0), 0) || 0;
      res.json({ activeLabs, totalPatients, reportsToday: totalReports, unreadAlerts: 7 });
    } else {
      res.json({ activeLabs: 8, totalPatients: 4821, reportsToday: 143, unreadAlerts: 7 });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Labs ──
app.get('/api/labs', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('labs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } else {
      res.json(MOCK.labs);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/labs', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('labs').insert([req.body]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } else {
      res.status(201).json({ ...req.body, id: Date.now().toString() });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/labs/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('labs').update(req.body).eq('id', req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } else {
      res.json({ ...req.body, id: req.params.id });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/labs/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('labs').delete().eq('id', req.params.id);
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Team Members ──
app.get('/api/team', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('team_members').select('*').order('created_at');
      if (error) throw error;
      res.json(data);
    } else {
      res.json(MOCK.team);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/team', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('team_members').insert([req.body]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } else {
      res.status(201).json({ ...req.body, id: Date.now().toString() });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/team/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('team_members').update(req.body).eq('id', req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } else {
      res.json({ ...req.body, id: req.params.id });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Activity Logs ──
app.get('/api/activity', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      res.json(data);
    } else {
      res.json(MOCK.activity);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Sessions ──
app.get('/api/sessions', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('sessions').select('*, labs(name, subdomain)').order('active_count', { ascending: false });
      if (error) throw error;
      res.json(data);
    } else {
      res.json([
        { lab: 'Apollo Diagnostics', subdomain: 'apollolab.labintel.in', count: 34, max: 50, color: '#00d4aa' },
        { lab: 'Sunrise Diagnostics', subdomain: 'sunrise.labintel.in', count: 22, max: 50, color: '#06b6d4' },
        { lab: 'City Lab Mumbai', subdomain: 'citylab.labintel.in', count: 16, max: 50, color: '#3b82f6' },
        { lab: 'MedCare Pathology', subdomain: 'medcare.labintel.in', count: 18, max: 50, color: '#6366f1' },
        { lab: 'HealthFirst Labs', subdomain: 'healthfirst.labintel.in', count: 7, max: 50, color: '#8b5cf6' },
      ]);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`\n🚀 LabIntel API running on http://localhost:${PORT}`);
  console.log(`📦 Supabase: ${isSupabaseConfigured() ? 'Connected' : 'Using mock data (configure .env to connect)'}\n`);
});
