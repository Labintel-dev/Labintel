'use strict';
const supabase = require('../db/supabase');

// ─── Cross-lab reports (all released reports for this patient) ─────────────
// This is the core patient portal query from section 8.4 of the backend doc.
async function getMyReports(req, res) {
  const patient_id = req.user.patient_id;

  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, reported_at, status, pdf_url, share_token, created_at,
      labs!reports_lab_id_fkey ( name, logo_url, primary_color ),
      test_panels ( name, short_code )
    `)
    .eq('patient_id', patient_id)
    .eq('status', 'released')
    .order('reported_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

// ─── Single report — verify patient ownership ──────────────────────────────
async function getMyReport(req, res) {
  const patient_id = req.user.patient_id;
  const report_id  = req.params.id;

  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      id, reported_at, status, pdf_url, share_token,
      labs!reports_lab_id_fkey ( name, logo_url, primary_color, address, phone ),
      test_panels ( name, short_code ),
      test_values (
        id, value, flag,
        test_parameters ( id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female, sort_order )
      ),
      report_insights ( summary, findings, recommendation )
    `)
    .eq('id', report_id)
    .eq('patient_id', patient_id)
    .eq('status', 'released')
    .single();

  if (error || !report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  // Sort test values
  if (report.test_values) {
    report.test_values.sort((a, b) =>
      (a.test_parameters?.sort_order || 0) - (b.test_parameters?.sort_order || 0)
    );
  }

  return res.json({ data: report });
}

// ─── Biomarker trends across ALL labs ────────────────────────────────────
async function getMyTrends(req, res) {
  const patient_id = req.user.patient_id;

  const { data: values, error } = await supabase
    .from('test_values')
    .select(`
      value, flag,
      test_parameters ( id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female ),
      reports!inner ( collected_at, status, patient_id )
    `)
    .eq('reports.patient_id', patient_id)
    .eq('reports.status', 'released')
    .order('reports.collected_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Group by parameter for time-series charts
  const grouped = {};
  for (const v of values || []) {
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

// ─── Get own patient profile ───────────────────────────────────────────────
async function getMyProfile(req, res) {
  const patient_id = req.user.patient_id;

  const { data, error } = await supabase
    .from('patients')
    .select('id, phone, full_name, date_of_birth, gender, created_at')
    .eq('id', patient_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Profile not found.' });
  return res.json({ data });
}

// ─── Update own patient profile ───────────────────────────────────────────
async function updateMyProfile(req, res) {
  const patient_id = req.user.patient_id;
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

module.exports = {
  getMyReports,
  getMyReport,
  getMyTrends,
  getMyProfile,
  updateMyProfile,
};
