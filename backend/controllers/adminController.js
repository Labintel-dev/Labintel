'use strict';
const supabase = require('../db/supabase');

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
  '#ec4899','#14b8a6','#f97316','#06b6d4','#3b82f6',
];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function generateCode(name = '') {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function labToCard(lab, patients = 0, reports = 0, staff = 0) {
  return {
    id:             lab.id,
    name:           lab.name,
    subdomain:      lab.slug ? `${lab.slug}.labintel.in` : lab.name.toLowerCase().replace(/\s+/g, '') + '.labintel.in',
    slug:           lab.slug,
    status:         lab.is_active ? 'ACTIVE' : 'INACTIVE',
    code:           generateCode(lab.name),
    avatar_color:   lab.primary_color || randomColor(),
    phone:          lab.phone,
    address:        lab.address,
    created_at:     lab.created_at,
    patients_count: patients,
    reports_count:  reports,
    staff_count:    staff,
    live_now:       0,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   GET /admin/stats
──────────────────────────────────────────────────────────────────────────── */
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [labsRes, patientsRes, reportsRes, alertsRes] = await Promise.all([
      supabase.from('labs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('health_alerts').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ]);

    res.json({
      activeLabs:    labsRes.count    ?? 0,
      totalPatients: patientsRes.count ?? 0,
      reportsToday:  reportsRes.count  ?? 0,
      unreadAlerts:  alertsRes.count   ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   GET /admin/labs
──────────────────────────────────────────────────────────────────────────── */
exports.getLabs = async (req, res) => {
  try {
    const { data: labs, error } = await supabase
      .from('labs')
      .select('id, name, slug, phone, address, primary_color, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all((labs || []).map(async (lab) => {
      const [pRes, rRes, sRes] = await Promise.all([
        supabase.from('lab_patients').select('id', { count: 'exact', head: true }).eq('lab_id', lab.id),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('lab_id', lab.id),
        supabase.from('lab_staff').select('id', { count: 'exact', head: true }).eq('lab_id', lab.id),
      ]);
      return labToCard(lab, pRes.count ?? 0, rRes.count ?? 0, sRes.count ?? 0);
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   POST /admin/labs
──────────────────────────────────────────────────────────────────────────── */
exports.createLab = async (req, res) => {
  try {
    const { name, slug, phone, address, adminEmail, adminPassword } = req.body;
    if (!name) return res.status(400).json({ error: 'Lab name is required' });
    if (!adminEmail || !adminPassword) return res.status(400).json({ error: 'Admin email and password are required' });

    const autoSlug = (slug || name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    
    // 1. Create the user in Supabase auth using the admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail.trim(),
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'manager' }
    });
    
    if (authError) throw authError;

    // 2. Create the lab
    const { data: labData, error: labError } = await supabase
      .from('labs')
      .insert({ name: name.trim(), slug: autoSlug, phone: phone || null, address: address || null, is_active: true })
      .select()
      .single();

    if (labError) throw labError;

    // 3. Create the staff member
    const { error: staffError } = await supabase
      .from('lab_staff')
      .insert({
        lab_id: labData.id,
        supabase_uid: authData.user.id,
        full_name: 'Lab Manager',
        email: adminEmail.trim(),
        role: 'manager',
        is_active: true
      });

    if (staffError) throw staffError;

    res.status(201).json(labToCard(labData));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   PUT /admin/labs/:id
──────────────────────────────────────────────────────────────────────────── */
exports.updateLab = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.name      !== undefined) updates.name      = req.body.name;
    if (req.body.slug      !== undefined) updates.slug      = req.body.slug;
    if (req.body.phone     !== undefined) updates.phone     = req.body.phone;
    if (req.body.address   !== undefined) updates.address   = req.body.address;
    // status toggle → is_active
    if (req.body.status    !== undefined) updates.is_active = req.body.status === 'ACTIVE';
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

    const { data, error } = await supabase
      .from('labs').update(updates).eq('id', id).select().single();

    if (error) throw error;
    res.json(labToCard(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   DELETE /admin/labs/:id
──────────────────────────────────────────────────────────────────────────── */
exports.deleteLab = async (req, res) => {
  try {
    const { error } = await supabase.from('labs').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   GET /admin/sessions
──────────────────────────────────────────────────────────────────────────── */
exports.getSessions = async (req, res) => {
  try {
    const { data: labs, error } = await supabase
      .from('labs')
      .select('id, name, slug, primary_color, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    const sessions = (labs || []).map(lab => ({
      id:        lab.id,
      lab:       lab.name,
      subdomain: lab.slug ? `${lab.slug}.labintel.in` : '',
      users:     0,
      max:       50,
      color:     lab.primary_color || randomColor(),
    }));

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   GET /admin/activity
──────────────────────────────────────────────────────────────────────────── */
exports.getActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const [reportsRes, alertsRes] = await Promise.all([
      supabase
        .from('reports')
        .select('id, created_at, status, patient_id, lab_id, patients(full_name), labs(name)')
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 2)),
      supabase
        .from('health_alerts')
        .select('id, triggered_at, message, alert_type, is_read, lab_id, labs(name)')
        .order('triggered_at', { ascending: false })
        .limit(Math.floor(limit / 2)),
    ]);

    const activity = [];

    (reportsRes.data || []).forEach(r => {
      const labName = r.labs?.name || 'Unknown Lab';
      const patName = r.patients?.full_name || 'a patient';
      let type = 'info';
      let msg  = `New report created for ${patName} at ${labName}`;
      if (r.status === 'released') { type = 'success'; msg = `Report released for ${patName} at ${labName}`; }
      else if (r.status === 'failed') { type = 'error'; msg = `Report failed for ${patName} at ${labName}`; }
      activity.push({ id: `r-${r.id}`, type, message: msg, time: new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }), ts: r.created_at });
    });

    (alertsRes.data || []).forEach(a => {
      const labName = a.labs?.name || 'Unknown Lab';
      const type    = a.alert_type === 'critical_value' ? 'error' : 'warning';
      activity.push({ id: `a-${a.id}`, type, message: `${a.message} — ${labName}`, time: new Date(a.triggered_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }), ts: a.triggered_at });
    });

    activity.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    res.json(activity.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   GET /admin/reports
──────────────────────────────────────────────────────────────────────────── */
exports.getReports = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [dataRes, todayRes, completedRes, processingRes, failedRes] = await Promise.all([
      supabase
        .from('reports')
        .select('id, status, created_at, patients(full_name), labs(name), test_panels(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase.from('reports').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'released'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).in('status', ['processing', 'pending']),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    if (dataRes.error) throw dataRes.error;

    const reports = (dataRes.data || []).map(r => ({
      id:      r.id,
      lab:     r.labs?.name          || 'Unknown Lab',
      type:    r.test_panels?.name   || 'Lab Test',
      patient: r.patients?.full_name || 'Unknown',
      date:    new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status:  r.status === 'released' ? 'Completed' : r.status === 'processing' ? 'Processing' : r.status === 'failed' ? 'Failed' : 'Pending',
    }));

    res.json({
      reports,
      total:           dataRes.count       ?? 0,
      todayCount:      todayRes.count      ?? 0,
      completedCount:  completedRes.count  ?? 0,
      processingCount: processingRes.count ?? 0,
      failedCount:     failedRes.count     ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   GET /admin/team
──────────────────────────────────────────────────────────────────────────── */
exports.getTeam = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lab_staff')
      .select('id, full_name, role, email, lab_id, is_active, labs(name, primary_color, slug)')
      .order('full_name');

    if (error) throw error;

    const formatted = (data || []).map(s => ({
      id:       s.id,
      name:     s.full_name,
      role:     s.role,
      email:    s.email,
      lab:      s.labs?.name || 'Unknown Lab',
      labColor: s.labs?.primary_color || '#6366f1',
      labCode:  generateCode(s.labs?.name || 'XX'),
      status:   s.is_active ? 'ACTIVE' : 'INACTIVE',
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
