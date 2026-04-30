'use strict';
const supabase = require('../db/supabase');
const logger   = require('../logger');

// ─── Get lab profile ───────────────────────────────────────────────────────
async function getLab(req, res) {
  const { data, error } = await supabase
    .from('labs')
    .select('id, name, slug, phone, address, logo_url, primary_color, is_active, created_at')
    .eq('id', req.user.lab_id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── Update lab profile ────────────────────────────────────────────────────
async function updateLab(req, res) {
  const { name, phone, address, logo_url, primary_color } = req.body;

  const { data, error } = await supabase
    .from('labs')
    .update({ name, phone, address, logo_url, primary_color })
    .eq('id', req.user.lab_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── List test panels with parameters ─────────────────────────────────────
async function listPanels(req, res) {
  const { data, error } = await supabase
    .from('test_panels')
    .select(`
      id, name, short_code, price, is_active,
      test_parameters (
        id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female, max_plausible, sort_order
      )
    `)
    .eq('lab_id', req.user.lab_id)
    .eq('is_active', true)
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── Create test panel with parameters ────────────────────────────────────
async function createPanel(req, res) {
  const { name, short_code, price, parameters } = req.body;
  const lab_id = req.user.lab_id;

  const { data: panel, error: panelError } = await supabase
    .from('test_panels')
    .insert({ lab_id, name, short_code, price })
    .select()
    .single();

  if (panelError) return res.status(500).json({ error: panelError.message });

  // Insert all parameters linked to this panel
  const paramRows = parameters.map((p, i) => ({
    panel_id:       panel.id,
    name:           p.name,
    unit:           p.unit,
    ref_min_male:   p.ref_min_male,
    ref_max_male:   p.ref_max_male,
    ref_min_female: p.ref_min_female,
    ref_max_female: p.ref_max_female,
    max_plausible:  p.max_plausible,
    sort_order:     p.sort_order ?? i,
  }));

  const { error: paramError } = await supabase.from('test_parameters').insert(paramRows);
  if (paramError) {
    await supabase.from('test_panels').delete().eq('id', panel.id); // rollback
    return res.status(500).json({ error: paramError.message });
  }

  // Fetch complete panel with parameters
  const { data: full } = await supabase
    .from('test_panels')
    .select('*, test_parameters (*)')
    .eq('id', panel.id)
    .single();

  return res.status(201).json({ data: full });
}

// ─── Update test panel ────────────────────────────────────────────────────
async function updatePanel(req, res) {
  const panel_id = req.params.id;
  const lab_id   = req.user.lab_id;
  const { name, short_code, price, is_active, parameters } = req.body;

  // Verify ownership
  const { data: panel } = await supabase
    .from('test_panels')
    .select('id')
    .eq('id', panel_id)
    .eq('lab_id', lab_id)
    .single();

  if (!panel) return res.status(404).json({ error: 'Panel not found.' });

  // Update panel metadata
  const updateFields = {};
  if (name       !== undefined) updateFields.name       = name;
  if (short_code !== undefined) updateFields.short_code = short_code;
  if (price      !== undefined) updateFields.price      = price;
  if (is_active  !== undefined) updateFields.is_active  = is_active;

  if (Object.keys(updateFields).length > 0) {
    await supabase.from('test_panels').update(updateFields).eq('id', panel_id);
  }

  // Replace parameters if provided
  if (parameters && Array.isArray(parameters)) {
    await supabase.from('test_parameters').delete().eq('panel_id', panel_id);
    const paramRows = parameters.map((p, i) => ({
      panel_id,
      name:           p.name,
      unit:           p.unit,
      ref_min_male:   p.ref_min_male,
      ref_max_male:   p.ref_max_male,
      ref_min_female: p.ref_min_female,
      ref_max_female: p.ref_max_female,
      max_plausible:  p.max_plausible,
      sort_order:     p.sort_order ?? i,
    }));
    await supabase.from('test_parameters').insert(paramRows);
  }

  const { data: updated } = await supabase
    .from('test_panels')
    .select('*, test_parameters (*)')
    .eq('id', panel_id)
    .single();

  return res.json({ data: updated });
}

// ─── Soft-delete (deactivate) panel ───────────────────────────────────────
async function softDeletePanel(req, res) {
  const panel_id = req.params.id;
  const lab_id   = req.user.lab_id;

  const { data, error } = await supabase
    .from('test_panels')
    .update({ is_active: false })
    .eq('id', panel_id)
    .eq('lab_id', lab_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Panel not found.' });
  return res.json({ data, message: 'Panel deactivated.' });
}

// ─── List all staff for this lab ──────────────────────────────────────────
async function listStaff(req, res) {
  const { data, error } = await supabase
    .from('lab_staff')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('lab_id', req.user.lab_id)
    .order('created_at');

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── Invite new staff (Supabase Auth invite email) ────────────────────────
async function inviteStaff(req, res) {
  const { email, full_name, role } = req.body;
  const lab_id = req.user.lab_id;

  // Check if email already exists at this lab
  const { data: existing } = await supabase
    .from('lab_staff')
    .select('id')
    .eq('email', email)
    .eq('lab_id', lab_id)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'A staff member with this email already exists at this lab.' });
  }

  // Create Supabase Auth user via admin API
  const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name, lab_id, role },
  });

  if (authError) {
    logger.error(`Auth invite failed for ${email}: ${authError.message}`);
    return res.status(500).json({ error: `Failed to send invite: ${authError.message}` });
  }

  // Pre-create the lab_staff record — supabase_uid will be filled on first login
  const { data: staff, error: staffError } = await supabase
    .from('lab_staff')
    .insert({
      lab_id,
      supabase_uid: authUser.user?.id,
      full_name,
      email,
      role,
    })
    .select()
    .single();

  if (staffError) {
    return res.status(500).json({ error: staffError.message });
  }

  return res.status(201).json({ data: staff, message: `Invite sent to ${email}` });
}

// ─── Update staff role or activation ──────────────────────────────────────
async function updateStaff(req, res) {
  const staff_id = req.params.id;
  const lab_id   = req.user.lab_id;
  const { role, is_active } = req.body;

  // Cannot modify your own account
  if (staff_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot modify your own account.' });
  }

  const update = {};
  if (role      !== undefined) update.role      = role;
  if (is_active !== undefined) update.is_active = is_active;

  const { data, error } = await supabase
    .from('lab_staff')
    .update(update)
    .eq('id', staff_id)
    .eq('lab_id', lab_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Staff member not found.' });
  return res.json({ data });
}

module.exports = {
  getLab, updateLab,
  listPanels, createPanel, updatePanel, softDeletePanel,
  listStaff, inviteStaff, updateStaff,
};
