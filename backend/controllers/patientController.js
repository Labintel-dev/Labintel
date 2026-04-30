'use strict';
const supabase = require('../db/supabase');
const logger   = require('../logger');

async function generateLabPatientCode(lab_id) {
  const { data: lab } = await supabase
    .from('labs')
    .select('slug')
    .eq('id', lab_id)
    .single();

  const prefix = (lab?.slug || 'LAB')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');

  const { count } = await supabase
    .from('lab_patients')
    .select('id', { count: 'exact', head: true })
    .eq('lab_id', lab_id);

  return `${prefix}-${String((count || 0) + 1).padStart(4, '0')}`;
}

// ─── List patients at this lab ─────────────────────────────────────────────
async function listPatients(req, res) {
  const lab_id = req.user.lab_id;
  const { search = '', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('lab_patients')
    .select(`
      id, lab_patient_code, referred_by, registered_at,
      patients!inner (
        id, phone, full_name, date_of_birth, gender
      )
    `, { count: 'exact' })
    .eq('lab_id', lab_id)
    .order('registered_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (search) {
    query = query.or(`patients.full_name.ilike.%${search}%,patients.phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    data,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
  });
}

// ─── Create or link patient (deduplication by phone) ──────────────────────
async function createPatient(req, res) {
  const lab_id = req.user.lab_id;
  const { phone, full_name, date_of_birth, gender, lab_patient_code, referred_by } = req.body;
  const patientCode = lab_patient_code?.trim() || await generateLabPatientCode(lab_id);

  // ── Step 1: Check if patient exists globally ──────────────────────────────
  let { data: existingPatient } = await supabase
    .from('patients')
    .select('id')
    .eq('phone', phone)
    .single();

  let patient_id;

  if (existingPatient) {
    // Patient exists — use their ID (do NOT update global record)
    patient_id = existingPatient.id;
  } else {
    // Create new global patient record
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({ phone, full_name, date_of_birth, gender })
      .select()
      .single();

    if (createError) {
      return res.status(500).json({ error: `Failed to create patient: ${createError.message}` });
    }
    patient_id = newPatient.id;
  }

  // ── Step 2: Check if already registered at THIS lab ──────────────────────
  const { data: existingLabPatient } = await supabase
    .from('lab_patients')
    .select('id, lab_patient_code, registered_at')
    .eq('lab_id', lab_id)
    .eq('patient_id', patient_id)
    .single();

  if (existingLabPatient) {
    return res.status(409).json({
      error:      'Patient is already registered at this lab.',
      lab_patient: existingLabPatient,
      patient_id,
    });
  }

  // ── Step 3: Register patient at this lab ──────────────────────────────────
  const { data: labPatient, error: lpError } = await supabase
    .from('lab_patients')
    .insert({ lab_id, patient_id, lab_patient_code: patientCode, referred_by })
    .select()
    .single();

  if (lpError) {
    return res.status(500).json({ error: `Failed to register patient: ${lpError.message}` });
  }

  // Fetch full patient record for response
  const { data: patient } = await supabase
    .from('patients')
    .select('id, phone, full_name, date_of_birth, gender')
    .eq('id', patient_id)
    .single();

  return res.status(201).json({ data: { patient, lab_patient: labPatient } });
}

// ─── Get single patient ────────────────────────────────────────────────────
async function getPatient(req, res) {
  const lab_id     = req.user.lab_id;
  const patient_id = req.params.id;

  const { data: labPatient, error } = await supabase
    .from('lab_patients')
    .select(`
      id, lab_patient_code, referred_by, registered_at,
      patients (
        id, phone, full_name, date_of_birth, gender, created_at
      )
    `)
    .eq('lab_id', lab_id)
    .eq('patient_id', patient_id)
    .single();

  if (error || !labPatient) {
    return res.status(404).json({ error: 'Patient not found at this lab.' });
  }

  return res.json({ data: labPatient });
}

// ─── Update patient demographics ───────────────────────────────────────────
async function updatePatient(req, res) {
  const lab_id     = req.user.lab_id;
  const patient_id = req.params.id;

  // Security: verify patient belongs to this lab before updating
  const { data: check } = await supabase
    .from('lab_patients')
    .select('id')
    .eq('lab_id', lab_id)
    .eq('patient_id', patient_id)
    .single();

  if (!check) {
    return res.status(404).json({ error: 'Patient not found at this lab.' });
  }

  const { full_name, date_of_birth, gender } = req.body;
  const { data, error } = await supabase
    .from('patients')
    .update({ full_name, date_of_birth, gender })
    .eq('id', patient_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── Get patient reports at THIS lab only ─────────────────────────────────
async function getPatientReports(req, res) {
  const lab_id     = req.user.lab_id;
  const patient_id = req.params.id;

  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, status, collected_at, reported_at, pdf_url, created_at,
      test_panels ( name, short_code )
    `)
    .eq('lab_id', lab_id)
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── Get patient biomarker trends ─────────────────────────────────────────
async function getPatientTrends(req, res) {
  const lab_id     = req.user.lab_id;
  const patient_id = req.params.id;

  const { data: values, error } = await supabase
    .from('test_values')
    .select(`
      value, flag,
      test_parameters ( id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female ),
      reports!inner ( collected_at, lab_id, patient_id, status )
    `)
    .eq('reports.lab_id', lab_id)
    .eq('reports.patient_id', patient_id)
    .eq('reports.status', 'released')
    .order('reports.collected_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Group by parameter for time-series charts
  const grouped = {};
  for (const v of values) {
    const paramId = v.test_parameters?.id;
    if (!paramId) continue;
    if (!grouped[paramId]) {
      grouped[paramId] = {
        parameter: v.test_parameters,
        data:      [],
      };
    }
    grouped[paramId].data.push({
      date:  v.reports?.collected_at,
      value: v.value,
      flag:  v.flag,
    });
  }

  return res.json({ data: Object.values(grouped) });
}

// ─── Get patient health alerts ────────────────────────────────────────────
async function getPatientAlerts(req, res) {
  const lab_id     = req.user.lab_id;
  const patient_id = req.params.id;

  const { data, error } = await supabase
    .from('health_alerts')
    .select(`
      id, alert_type, message, is_read, triggered_at,
      test_parameters ( name, unit )
    `)
    .eq('lab_id', lab_id)
    .eq('patient_id', patient_id)
    .order('triggered_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── Mark alert as read ────────────────────────────────────────────────────
async function resolveAlert(req, res) {
  const lab_id   = req.user.lab_id;
  const alert_id = req.params.alertId;

  const { data, error } = await supabase
    .from('health_alerts')
    .update({ is_read: true })
    .eq('id', alert_id)
    .eq('lab_id', lab_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Alert not found.' });
  return res.json({ data });
}

module.exports = {
  listPatients,
  createPatient,
  getPatient,
  updatePatient,
  getPatientReports,
  getPatientTrends,
  getPatientAlerts,
  resolveAlert,
};
