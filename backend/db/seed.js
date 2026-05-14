'use strict';
/**
 * Seed script — creates a complete realistic demo dataset.
 * Idempotent: safe to run multiple times (uses upsert / ON CONFLICT handling).
 *
 * Usage: npm run seed
 *
 * What it creates:
 *  - 2 labs (testlab, secondlab)
 *  - 6 staff (3 per lab: 1 manager, 1 receptionist, 1 technician)
 *  - 5 test panels (CBC, LFT, KFT, Lipid, Thyroid) with ~35 parameters
 *  - 5 patients (global), 7 lab_patient records (cross-lab test)
 *  - 10 reports (mix of statuses), ~80 test_values (some flagged)
 *  - 5 report_insights (pre-seeded AI summaries)
 *  - 3 health_alerts (one of each type)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helpers ───────────────────────────────────────────────────────────────
function log(msg) { console.log(`  ${msg}`); }
function section(title) { console.log(`\n📦  ${title}`); }

async function upsert(table, rows, conflictKey) {
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: conflictKey, ignoreDuplicates: false })
    .select();
  if (error) throw new Error(`Upsert ${table} failed: ${error.message}`);
  return data;
}

// ─── 1. Labs ───────────────────────────────────────────────────────────────
async function seedLabs() {
  section('Labs');
  const rows = await upsert('labs', [
    {
      slug:          'testlab',
      name:          'Sunrise Diagnostics',
      phone:         '+918389874313',
      address:       'Kolkata, West Bengal 700001',
      primary_color: '#1A5276',
      is_active:     true,
    },
    {
      slug:          'secondlab',
      name:          'City Diagnostics',
      phone:         '+918597236321',
      address:       'Haldia, Purba Medinipur, West Bengal',
      primary_color: '#1E8449',
      is_active:     true,
    },
  ], 'slug');
  const labs = {};
  rows.forEach(r => { labs[r.slug] = r.id; });
  log(`testlab   → ${labs.testlab}`);
  log(`secondlab → ${labs.secondlab}`);
  return labs;
}

// ─── 2. Staff (Supabase Auth + lab_staff) ─────────────────────────────────
async function seedStaff(labs) {
  section('Staff (Auth users + lab_staff records)');

  const staffDefs = [
    // testlab
    { lab: 'testlab',   email: 'manager@sunrise.in',    name: 'Arjun Sharma',   role: 'manager',        pw: 'Manager@1234' },
    { lab: 'testlab',   email: 'recept@sunrise.in',     name: 'Priya Patel',    role: 'receptionist',   pw: 'Recept@1234' },
    { lab: 'testlab',   email: 'tech@sunrise.in',       name: 'Rahul Gupta',    role: 'technician',     pw: 'Tech@1234' },
    // secondlab
    { lab: 'secondlab', email: 'manager@citydiag.in',   name: 'Sunita Mehta',   role: 'manager',        pw: 'Manager@5678' },
    { lab: 'secondlab', email: 'recept@citydiag.in',    name: 'Vikram Singh',   role: 'receptionist',   pw: 'Recept@5678' },
    { lab: 'secondlab', email: 'tech@citydiag.in',      name: 'Ananya Bose',    role: 'technician',     pw: 'Tech@5678' },
  ];

  const staffIds = {};

  for (const s of staffDefs) {
    // Try to create Supabase Auth user
    let authId;
    const { data: existing } = await supabase.auth.admin.listUsers();
    const existingUser = existing?.users?.find(u => u.email === s.email);

    if (existingUser) {
      authId = existingUser.id;
      log(`Auth user exists: ${s.email}`);
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email:             s.email,
        password:          s.pw,
        email_confirm:     true,
        user_metadata:     { full_name: s.name },
      });
      if (error) {
        log(`⚠️  Auth create failed for ${s.email}: ${error.message} — skipping`);
        continue;
      }
      authId = created.user.id;
      log(`Created auth: ${s.email}`);
    }

    // Upsert lab_staff record
    const { data: staffRow, error: staffErr } = await supabase
      .from('lab_staff')
      .upsert({
        lab_id:       labs[s.lab],
        supabase_uid: authId,
        full_name:    s.name,
        email:        s.email,
        role:         s.role,
        is_active:    true,
      }, { onConflict: 'email' })
      .select()
      .single();

    if (staffErr) {
      log(`⚠️  lab_staff upsert failed for ${s.email}: ${staffErr.message}`);
    } else {
      staffIds[s.email] = staffRow.id;
      log(`Staff: ${s.name} (${s.role}) → ${staffRow.id}`);
    }
  }

  return staffIds;
}

// ─── 3. Test Panels + Parameters ──────────────────────────────────────────
async function seedPanels(labs) {
  section('Test Panels + Parameters');

  const PANELS = [
    {
      name: 'Complete Blood Count', short_code: 'CBC', price: 250,
      params: [
        { name: 'Hemoglobin', unit: 'g/dL', ref_min_male: 13.0, ref_max_male: 17.0, ref_min_female: 12.0, ref_max_female: 16.0, max_plausible: 25, sort_order: 1 },
        { name: 'RBC Count',  unit: 'M/µL', ref_min_male: 4.5,  ref_max_male: 5.5,  ref_min_female: 4.0,  ref_max_female: 5.0,  max_plausible: 10, sort_order: 2 },
        { name: 'WBC Count',  unit: '/µL',  ref_min_male: 4500, ref_max_male: 11000, ref_min_female: 4500, ref_max_female: 11000, max_plausible: 30000, sort_order: 3 },
        { name: 'Platelets',  unit: '/µL',  ref_min_male: 150000, ref_max_male: 400000, ref_min_female: 150000, ref_max_female: 400000, max_plausible: 1000000, sort_order: 4 },
        { name: 'Hematocrit', unit: '%',    ref_min_male: 40, ref_max_male: 52, ref_min_female: 36, ref_max_female: 48, max_plausible: 70, sort_order: 5 },
        { name: 'MCV',        unit: 'fL',   ref_min_male: 80, ref_max_male: 100, ref_min_female: 80, ref_max_female: 100, max_plausible: 130, sort_order: 6 },
      ],
    },
    {
      name: 'Liver Function Test', short_code: 'LFT', price: 450,
      params: [
        { name: 'SGPT / ALT', unit: 'U/L', ref_min_male: 7, ref_max_male: 56, ref_min_female: 7, ref_max_female: 45, max_plausible: 2000, sort_order: 1 },
        { name: 'SGOT / AST', unit: 'U/L', ref_min_male: 10, ref_max_male: 40, ref_min_female: 10, ref_max_female: 40, max_plausible: 2000, sort_order: 2 },
        { name: 'Total Bilirubin', unit: 'mg/dL', ref_min_male: 0.1, ref_max_male: 1.2, ref_min_female: 0.1, ref_max_female: 1.2, max_plausible: 30, sort_order: 3 },
        { name: 'Direct Bilirubin', unit: 'mg/dL', ref_min_male: 0.0, ref_max_male: 0.3, ref_min_female: 0.0, ref_max_female: 0.3, max_plausible: 15, sort_order: 4 },
        { name: 'Alkaline Phosphatase', unit: 'U/L', ref_min_male: 44, ref_max_male: 147, ref_min_female: 44, ref_max_female: 147, max_plausible: 1000, sort_order: 5 },
        { name: 'Total Protein', unit: 'g/dL', ref_min_male: 6.3, ref_max_male: 8.2, ref_min_female: 6.3, ref_max_female: 8.2, max_plausible: 15, sort_order: 6 },
        { name: 'Albumin', unit: 'g/dL', ref_min_male: 3.5, ref_max_male: 5.0, ref_min_female: 3.5, ref_max_female: 5.0, max_plausible: 8, sort_order: 7 },
      ],
    },
    {
      name: 'Kidney Function Test', short_code: 'KFT', price: 350,
      params: [
        { name: 'Serum Creatinine', unit: 'mg/dL', ref_min_male: 0.7, ref_max_male: 1.2, ref_min_female: 0.5, ref_max_female: 1.0, max_plausible: 20, sort_order: 1 },
        { name: 'Blood Urea', unit: 'mg/dL', ref_min_male: 15, ref_max_male: 45, ref_min_female: 15, ref_max_female: 45, max_plausible: 200, sort_order: 2 },
        { name: 'Uric Acid', unit: 'mg/dL', ref_min_male: 3.5, ref_max_male: 7.2, ref_min_female: 2.6, ref_max_female: 6.0, max_plausible: 20, sort_order: 3 },
        { name: 'Sodium', unit: 'mEq/L', ref_min_male: 136, ref_max_male: 145, ref_min_female: 136, ref_max_female: 145, max_plausible: 160, sort_order: 4 },
        { name: 'Potassium', unit: 'mEq/L', ref_min_male: 3.5, ref_max_male: 5.0, ref_min_female: 3.5, ref_max_female: 5.0, max_plausible: 8, sort_order: 5 },
      ],
    },
    {
      name: 'Lipid Profile', short_code: 'LIPID', price: 400,
      params: [
        { name: 'Total Cholesterol', unit: 'mg/dL', ref_min_male: 0, ref_max_male: 200, ref_min_female: 0, ref_max_female: 200, max_plausible: 500, sort_order: 1 },
        { name: 'LDL Cholesterol', unit: 'mg/dL', ref_min_male: 0, ref_max_male: 130, ref_min_female: 0, ref_max_female: 130, max_plausible: 400, sort_order: 2 },
        { name: 'HDL Cholesterol', unit: 'mg/dL', ref_min_male: 40, ref_max_male: 60, ref_min_female: 50, ref_max_female: 80, max_plausible: 120, sort_order: 3 },
        { name: 'Triglycerides', unit: 'mg/dL', ref_min_male: 0, ref_max_male: 150, ref_min_female: 0, ref_max_female: 150, max_plausible: 800, sort_order: 4 },
        { name: 'VLDL Cholesterol', unit: 'mg/dL', ref_min_male: 5, ref_max_male: 40, ref_min_female: 5, ref_max_female: 40, max_plausible: 160, sort_order: 5 },
      ],
    },
    {
      name: 'Thyroid Panel', short_code: 'TFT', price: 600,
      params: [
        { name: 'TSH', unit: 'mIU/L', ref_min_male: 0.4, ref_max_male: 4.0, ref_min_female: 0.4, ref_max_female: 4.0, max_plausible: 50, sort_order: 1 },
        { name: 'T3 (Triiodothyronine)', unit: 'ng/dL', ref_min_male: 80, ref_max_male: 200, ref_min_female: 80, ref_max_female: 200, max_plausible: 400, sort_order: 2 },
        { name: 'T4 (Thyroxine)', unit: 'µg/dL', ref_min_male: 5.1, ref_max_male: 14.1, ref_min_female: 5.1, ref_max_female: 14.1, max_plausible: 30, sort_order: 3 },
        { name: 'Free T3', unit: 'pg/mL', ref_min_male: 2.0, ref_max_male: 4.4, ref_min_female: 2.0, ref_max_female: 4.4, max_plausible: 10, sort_order: 4 },
        { name: 'Free T4', unit: 'ng/dL', ref_min_male: 0.7, ref_max_male: 1.9, ref_min_female: 0.7, ref_max_female: 1.9, max_plausible: 5, sort_order: 5 },
      ],
    },
  ];

  const panelIds   = {}; // key: 'labSlug::shortCode' => panel_id
  const paramIds   = {}; // key: 'panel_id::paramName' => param_id

  for (const labSlug of ['testlab', 'secondlab']) {
    for (const panelDef of PANELS) {
      // Check if panel already exists
      const { data: existing } = await supabase
        .from('test_panels')
        .select('id')
        .eq('lab_id', labs[labSlug])
        .eq('short_code', panelDef.short_code)
        .single();

      let panelId;
      if (existing) {
        panelId = existing.id;
        log(`Panel exists: ${labSlug}::${panelDef.short_code}`);
      } else {
        const { data: panel, error } = await supabase
          .from('test_panels')
          .insert({ lab_id: labs[labSlug], name: panelDef.name, short_code: panelDef.short_code, price: panelDef.price })
          .select()
          .single();
        if (error) { log(`⚠️ Panel insert failed: ${error.message}`); continue; }
        panelId = panel.id;
        log(`Panel: ${labSlug}::${panelDef.short_code} → ${panelId}`);
      }
      panelIds[`${labSlug}::${panelDef.short_code}`] = panelId;

      // Parameters
      for (const param of panelDef.params) {
        const { data: existingParam } = await supabase
          .from('test_parameters')
          .select('id')
          .eq('panel_id', panelId)
          .eq('name', param.name)
          .single();

        let paramId;
        if (existingParam) {
          paramId = existingParam.id;
        } else {
          const { data: p, error } = await supabase
            .from('test_parameters')
            .insert({ panel_id: panelId, ...param })
            .select()
            .single();
          if (error) { log(`⚠️ Param insert failed: ${param.name} - ${error.message}`); continue; }
          paramId = p.id;
        }
        paramIds[`${panelId}::${param.name}`] = paramId;
      }
    }
  }

  return { panelIds, paramIds };
}

// ─── 4. Patients ───────────────────────────────────────────────────────────
async function seedPatients() {
  section('Patients');
  const rows = await upsert('patients', [
    { phone: '+919876543210', full_name: 'Ramesh Kumar',    date_of_birth: '1965-03-15', gender: 'male' },
    { phone: '+919845321098', full_name: 'Sushma Verma',    date_of_birth: '1978-07-22', gender: 'female' },
    { phone: '+919812345678', full_name: 'Arjun Singh',     date_of_birth: '1990-11-08', gender: 'male' },
    { phone: '+919867890123', full_name: 'Kavita Reddy',    date_of_birth: '1955-01-30', gender: 'female' },
    { phone: '+919898765432', full_name: 'Deepak Nair',     date_of_birth: '1983-06-12', gender: 'male' },
  ], 'phone');
  const pats = {};
  rows.forEach(r => { pats[r.phone] = r.id; });
  Object.entries(pats).forEach(([p, id]) => log(`${p} → ${id}`));
  return pats;
}

// ─── 5. Lab Patients (7 registrations, 2 patients at both labs) ────────────
async function seedLabPatients(labs, patients) {
  section('Lab Patients');
  const registrations = [
    // testlab — 3 exclusive + 2 cross-lab
    { lab: 'testlab',   phone: '+919876543210', code: 'SUN-001', ref: 'Dr. P. Iyer' },
    { lab: 'testlab',   phone: '+919845321098', code: 'SUN-002', ref: 'Dr. A. Mehta' },
    { lab: 'testlab',   phone: '+919812345678', code: 'SUN-003', ref: null },
    { lab: 'testlab',   phone: '+919867890123', code: 'SUN-004', ref: 'Dr. S. Sharma' }, // cross-lab
    { lab: 'testlab',   phone: '+919898765432', code: 'SUN-005', ref: 'Dr. R. Gupta' }, // cross-lab
    // secondlab — 2 exclusive + 2 cross-lab
    { lab: 'secondlab', phone: '+919812345678', code: 'CTY-001', ref: 'Dr. V. Pillai' }, // only secondlab
    { lab: 'secondlab', phone: '+919867890123', code: 'CTY-004', ref: 'Dr. K. Nair' },   // cross-lab
    { lab: 'secondlab', phone: '+919898765432', code: 'CTY-005', ref: 'Dr. M. Joshi' },  // cross-lab
  ];

  const lpIds = {};
  for (const reg of registrations) {
    const patient_id = patients[reg.phone];
    const lab_id     = labs[reg.lab];
    if (!patient_id || !lab_id) { log(`⚠️ Missing IDs for ${reg.phone}@${reg.lab}`); continue; }

    const { data: existing } = await supabase
      .from('lab_patients')
      .select('id')
      .eq('lab_id', lab_id)
      .eq('patient_id', patient_id)
      .single();

    if (existing) {
      lpIds[`${reg.lab}::${reg.phone}`] = existing.id;
      log(`lab_patient exists: ${reg.lab}::${reg.phone}`);
    } else {
      const { data: lp, error } = await supabase
        .from('lab_patients')
        .insert({ lab_id, patient_id, lab_patient_code: reg.code, referred_by: reg.ref })
        .select()
        .single();
      if (error) { log(`⚠️ lab_patient failed: ${error.message}`); continue; }
      lpIds[`${reg.lab}::${reg.phone}`] = lp.id;
      log(`Registered ${reg.phone} @ ${reg.lab} (${reg.code})`);
    }
  }
  return lpIds;
}

// ─── 6. Reports + Test Values + Insights ──────────────────────────────────
async function seedReports(labs, patients, staffIds, panelIds, paramIds) {
  section('Reports + Test Values + Insights');
  const { computeFlag } = require('../services/flagService');

  // Helper: get param ID safely
  const pid = (panelId, paramName) => paramIds[`${panelId}::${paramName}`];

  const reportDefs = [
    // 5 released reports (testlab)
    {
      lab: 'testlab', phone: '+919876543210', panel: 'CBC', status: 'released',
      tech: 'tech@sunrise.in', daysAgo: 30, gender: 'male',
      values: { 'Hemoglobin': 9.0, 'RBC Count': 3.8, 'WBC Count': 12500, 'Platelets': 140000, 'Hematocrit': 28, 'MCV': 72 },
    },
    {
      lab: 'testlab', phone: '+919845321098', panel: 'LFT', status: 'released',
      tech: 'tech@sunrise.in', daysAgo: 20, gender: 'female',
      values: { 'SGPT / ALT': 85, 'SGOT / AST': 78, 'Total Bilirubin': 2.1, 'Direct Bilirubin': 0.8, 'Alkaline Phosphatase': 120, 'Total Protein': 6.5, 'Albumin': 3.2 },
    },
    {
      lab: 'testlab', phone: '+919812345678', panel: 'KFT', status: 'released',
      tech: 'tech@sunrise.in', daysAgo: 15, gender: 'male',
      values: { 'Serum Creatinine': 1.8, 'Blood Urea': 68, 'Uric Acid': 8.5, 'Sodium': 138, 'Potassium': 4.2 },
    },
    {
      lab: 'testlab', phone: '+919867890123', panel: 'LIPID', status: 'released',
      tech: 'tech@sunrise.in', daysAgo: 10, gender: 'female',
      values: { 'Total Cholesterol': 245, 'LDL Cholesterol': 165, 'HDL Cholesterol': 42, 'Triglycerides': 220, 'VLDL Cholesterol': 44 },
    },
    {
      lab: 'testlab', phone: '+919898765432', panel: 'TFT', status: 'released',
      tech: 'tech@sunrise.in', daysAgo: 5, gender: 'male',
      values: { 'TSH': 8.5, 'T3 (Triiodothyronine)': 75, 'T4 (Thyroxine)': 4.2, 'Free T3': 1.8, 'Free T4': 0.6 },
    },
    // 3 in-review / draft reports (testlab)
    {
      lab: 'testlab', phone: '+919876543210', panel: 'LFT', status: 'in_review',
      tech: 'tech@sunrise.in', daysAgo: 2, gender: 'male',
      values: { 'SGPT / ALT': 32, 'SGOT / AST': 28, 'Total Bilirubin': 0.8, 'Direct Bilirubin': 0.2, 'Alkaline Phosphatase': 95, 'Total Protein': 7.1, 'Albumin': 4.2 },
    },
    {
      lab: 'testlab', phone: '+919845321098', panel: 'CBC', status: 'draft',
      tech: 'tech@sunrise.in', daysAgo: 1, gender: 'female',
      values: { 'Hemoglobin': 11.5, 'RBC Count': 4.1, 'WBC Count': 7200, 'Platelets': 210000, 'Hematocrit': 35, 'MCV': 84 },
    },
    // secondlab reports
    {
      lab: 'secondlab', phone: '+919867890123', panel: 'CBC', status: 'released',
      tech: 'tech@citydiag.in', daysAgo: 60, gender: 'female',
      values: { 'Hemoglobin': 9.8, 'RBC Count': 3.9, 'WBC Count': 5800, 'Platelets': 185000, 'Hematocrit': 30, 'MCV': 76 },
    },
    {
      lab: 'secondlab', phone: '+919898765432', panel: 'KFT', status: 'released',
      tech: 'tech@citydiag.in', daysAgo: 45, gender: 'male',
      values: { 'Serum Creatinine': 2.2, 'Blood Urea': 85, 'Uric Acid': 9.1, 'Sodium': 134, 'Potassium': 5.8 },
    },
    {
      lab: 'secondlab', phone: '+919812345678', panel: 'LIPID', status: 'released',
      tech: 'tech@citydiag.in', daysAgo: 3, gender: 'male',
      values: { 'Total Cholesterol': 185, 'LDL Cholesterol': 110, 'HDL Cholesterol': 55, 'Triglycerides': 120, 'VLDL Cholesterol': 24 },
    },
  ];

  const reportIds = [];

  for (const r of reportDefs) {
    const lab_id     = labs[r.lab];
    const patient_id = patients[r.phone];
    const panel_id   = panelIds[`${r.lab}::${r.panel}`];
    const staff_id   = staffIds[r.tech];

    if (!lab_id || !patient_id || !panel_id) {
      log(`⚠️ Skipping report: missing IDs for ${r.lab}/${r.phone}/${r.panel}`);
      continue;
    }

    const collected_at = new Date(Date.now() - r.daysAgo * 24 * 3600 * 1000).toISOString();
    const reported_at  = r.status === 'released'
      ? new Date(Date.now() - (r.daysAgo - 1) * 24 * 3600 * 1000).toISOString()
      : null;

    // Check for existing report at same lab/patient/panel/collected_at (approximate)
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id, status')
      .eq('lab_id', lab_id)
      .eq('patient_id', patient_id)
      .eq('panel_id', panel_id)
      .limit(1)
      .maybeSingle();

    let reportId;
    if (existingReport) {
      reportId = existingReport.id;
      log(`Report exists: ${r.lab}/${r.phone}/${r.panel}`);
    } else {
      const { data: report, error } = await supabase
        .from('reports')
        .insert({ lab_id, patient_id, panel_id, collected_at, reported_at, status: r.status, created_by: staff_id })
        .select()
        .single();
      if (error) { log(`⚠️ Report insert failed: ${error.message}`); continue; }
      reportId = report.id;
      log(`Report: ${r.lab}/${r.panel} (${r.status}) → ${reportId}`);
    }

    reportIds.push(reportId);

    // Test values (skip if already seeded)
    const { data: existingValues } = await supabase
      .from('test_values')
      .select('id')
      .eq('report_id', reportId)
      .limit(1);

    if (!existingValues || existingValues.length === 0) {
      const valueRows = [];
      for (const [paramName, value] of Object.entries(r.values)) {
        const parameter_id = pid(panel_id, paramName);
        if (!parameter_id) continue;

        // Fetch parameter for flag computation
        const { data: param } = await supabase
          .from('test_parameters')
          .select('*')
          .eq('id', parameter_id)
          .single();

        const flag = param ? computeFlag(value, r.gender, param) : 'normal';
        valueRows.push({ report_id: reportId, parameter_id, value, flag });
      }

      if (valueRows.length > 0) {
        const { error } = await supabase.from('test_values').insert(valueRows);
        if (error) log(`⚠️ test_values insert failed: ${error.message}`);
      }
    }

    // Pre-seeded report_insights for released reports
    if (r.status === 'released') {
      const { data: existingInsight } = await supabase
        .from('report_insights')
        .select('id')
        .eq('report_id', reportId)
        .single();

      if (!existingInsight) {
        await supabase.from('report_insights').insert({
          report_id:      reportId,
          summary:        `Test results for ${r.panel} show some values outside the normal range. Please review the highlighted parameters with your doctor.`,
          findings:       Object.entries(r.values)
            .filter(([, v]) => typeof v === 'number' && (v > 200 || v < 0.5))
            .map(([name]) => `${name} is outside the expected reference range`).slice(0, 3),
          recommendation: 'Please consult your treating physician to discuss these results and determine if any follow-up is needed.',
          model_used:     'seed-data',
        });
      }
    }
  }

  return reportIds;
}

// ─── 7. Health Alerts ─────────────────────────────────────────────────────
async function seedAlerts(labs, patients) {
  section('Health Alerts');

  // Get a parameter ID to use for alerts
  const { data: params } = await supabase
    .from('test_parameters')
    .select('id, name')
    .limit(3);

  if (!params || params.length < 3) {
    log('⚠️ Not enough parameters for alerts — skipping');
    return;
  }

  const alertDefs = [
    {
      lab: 'testlab',   phone: '+919876543210',
      type: 'critical_value',       param: params[0].id,
      message: `Critical alert: Hemoglobin is critically LOW (value: 9.0 g/dL) — immediate attention required.`,
    },
    {
      lab: 'testlab',   phone: '+919845321098',
      type: 'worsening_trend',      param: params[1].id,
      message: `Worsening trend: SGPT/ALT has been abnormal and deteriorating across the last 3 reports. Continued monitoring recommended.`,
    },
    {
      lab: 'secondlab', phone: '+919898765432',
      type: 'persistent_abnormal',  param: params[2].id,
      message: `Persistent abnormal: Serum Creatinine has been outside normal range in 3 of the last 4 reports.`,
    },
  ];

  for (const a of alertDefs) {
    const { data: existing } = await supabase
      .from('health_alerts')
      .select('id')
      .eq('lab_id', labs[a.lab])
      .eq('patient_id', patients[a.phone])
      .eq('alert_type', a.type)
      .single();

    if (existing) {
      log(`Alert exists: ${a.type} @ ${a.lab}`);
      continue;
    }

    const { error } = await supabase.from('health_alerts').insert({
      lab_id:       labs[a.lab],
      patient_id:   patients[a.phone],
      parameter_id: a.param,
      alert_type:   a.type,
      message:      a.message,
    });
    if (error) log(`⚠️ Alert insert failed: ${error.message}`);
    else log(`Alert: ${a.type} @ ${a.lab}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  LabIntel Seed Script Starting...\n');

  try {
    const labs     = await seedLabs();
    const staff    = await seedStaff(labs);
    const { panelIds, paramIds } = await seedPanels(labs);
    const patients = await seedPatients();
    await seedLabPatients(labs, patients);
    await seedReports(labs, patients, staff, panelIds, paramIds);
    await seedAlerts(labs, patients);

    console.log('\n✅  Seed complete!\n');
    console.log('Staff login credentials:');
    console.log('  testlab manager:  manager@sunrise.in / Manager@1234');
    console.log('  testlab recept:   recept@sunrise.in / Recept@1234');
    console.log('  testlab tech:     tech@sunrise.in / Tech@1234');
    console.log('  secondlab manager: manager@citydiag.in / Manager@5678');
    console.log('  secondlab recept:  recept@citydiag.in / Recept@5678');
    console.log('  secondlab tech:    tech@citydiag.in / Tech@5678');
    console.log('\nPatient portal OTP phones:');
    console.log('  +919876543210, +919845321098, +919812345678, +919867890123, +919898765432');
  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
