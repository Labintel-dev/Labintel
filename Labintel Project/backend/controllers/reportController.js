'use strict';
const supabase = require('../db/supabase');
const { computeFlag }            = require('../services/flagService');
const { generateInsight }        = require('../services/gemini');
const { generateAndUploadPDF }   = require('../services/pdf');
const { getSignedUrl }           = require('../services/storage');
const { sendReportReady }        = require('../services/sms');
const logger = require('../logger');

// Status transition rules (forward only)
const VALID_TRANSITIONS = {
  draft:     'in_review',
  in_review: 'released',
};

// ─── List all reports for this lab ────────────────────────────────────────
async function listReports(req, res) {
  const lab_id = req.user.lab_id;
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('reports')
    .select(`
      id, status, collected_at, reported_at, pdf_url, created_at,
      patients ( full_name, phone ),
      test_panels ( name, short_code ),
      lab_staff!reports_created_by_fkey ( full_name )
    `, { count: 'exact' })
    .eq('lab_id', lab_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    data,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
  });
}

// ─── Create report (synchronous) + trigger AI + PDF (async) ──────────────
async function createReport(req, res) {
  const lab_id     = req.user.lab_id;
  const created_by = req.user.id;
  const { panel_id, patient_id, collected_at, values } = req.body;

  // ── Verify panel belongs to THIS lab ──────────────────────────────────────
  const { data: panel, error: panelError } = await supabase
    .from('test_panels')
    .select('id, name, short_code')
    .eq('id', panel_id)
    .eq('lab_id', lab_id)
    .single();

  if (panelError || !panel) {
    return res.status(404).json({ error: 'Test panel not found or does not belong to this lab.' });
  }

  // ── Verify patient is registered at this lab ───────────────────────────────
  const { data: labPatient } = await supabase
    .from('lab_patients')
    .select('patient_id')
    .eq('lab_id', lab_id)
    .eq('patient_id', patient_id)
    .single();

  if (!labPatient) {
    return res.status(404).json({ error: 'Patient is not registered at this lab.' });
  }

  // ── Get patient demographics for flag calculation ──────────────────────────
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, full_name, gender, date_of_birth, phone')
    .eq('id', patient_id)
    .single();

  if (patientError || !patient) {
    return res.status(404).json({ error: 'Patient record not found.' });
  }

  // ── Fetch parameter definitions for flag computation ──────────────────────
  const paramIds = values.map(v => v.parameter_id);
  const { data: parameters, error: paramError } = await supabase
    .from('test_parameters')
    .select('*')
    .in('id', paramIds);

  if (paramError) {
    return res.status(500).json({ error: `Failed to fetch parameters: ${paramError.message}` });
  }

  const paramMap = {};
  parameters.forEach(p => { paramMap[p.id] = p; });

  // ── Insert report row ──────────────────────────────────────────────────────
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .insert({ lab_id, patient_id, panel_id, collected_at, created_by, status: 'draft' })
    .select()
    .single();

  if (reportError) {
    return res.status(500).json({ error: `Failed to create report: ${reportError.message}` });
  }

  // ── Compute flags + build test_values rows ─────────────────────────────────
  const testValuesRows = values.map(v => ({
    report_id:    report.id,
    parameter_id: v.parameter_id,
    value:        v.value,
    flag:         paramMap[v.parameter_id]
      ? computeFlag(v.value, patient.gender, paramMap[v.parameter_id])
      : 'normal',
  }));

  const { error: valuesError } = await supabase
    .from('test_values')
    .insert(testValuesRows);

  if (valuesError) {
    // Rollback: delete the orphan report
    await supabase.from('reports').delete().eq('id', report.id);
    return res.status(500).json({ error: `Failed to save test values: ${valuesError.message}` });
  }

  // ── Return 201 immediately ─────────────────────────────────────────────────
  res.status(201).json({
    data:    report,
    message: 'Report created. AI analysis and PDF generation are in progress.',
  });

  // ── Async: Generate AI insight ─────────────────────────────────────────────
  (async () => {
    try {
      const dob = patient.date_of_birth ? new Date(patient.date_of_birth) : null;
      const age = dob
        ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
        : 'Unknown';

      const insightInput = values.map(v => {
        const p = paramMap[v.parameter_id];
        const isFemale = patient.gender === 'female';
        return {
          name:    p?.name   || 'Unknown',
          value:   v.value,
          unit:    p?.unit   || '',
          ref_min: isFemale ? p?.ref_min_female : p?.ref_min_male,
          ref_max: isFemale ? p?.ref_max_female : p?.ref_max_male,
          flag:    testValuesRows.find(r => r.parameter_id === v.parameter_id)?.flag || 'normal',
        };
      });

      const insight = await generateInsight(
        { age, gender: patient.gender || 'unknown' },
        panel,
        insightInput
      );

      await supabase.from('report_insights').upsert({
        report_id:      report.id,
        summary:        insight.summary,
        findings:       insight.findings,
        recommendation: insight.recommendation,
        model_used:     'gemini-1.5-flash',
      }, { onConflict: 'report_id' });

      logger.info(`AI insight saved for report ${report.id}`);
    } catch (err) {
      logger.error(`AI insight generation failed for report ${report.id}: ${err.message}`);
    }
  })();

  // ── Async: Generate PDF ────────────────────────────────────────────────────
  setTimeout(() => generateAndUploadPDF(report.id), 3000); // wait 3s for insight to save
}

// ─── Get single report (full data) ────────────────────────────────────────
async function getReport(req, res) {
  const lab_id    = req.user.lab_id;
  const report_id = req.params.id;

  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      id, status, collected_at, reported_at, pdf_url, share_token, created_at,
      patients ( id, full_name, phone, date_of_birth, gender ),
      test_panels ( id, name, short_code ),
      lab_staff!reports_created_by_fkey ( full_name ),
      test_values (
        id, value, flag,
        test_parameters ( id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female, sort_order )
      ),
      report_insights ( summary, findings, recommendation, model_used, generated_at )
    `)
    .eq('id', report_id)
    .eq('lab_id', lab_id)
    .single();

  if (error || !report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  // Sort values by parameter sort_order
  if (report.test_values) {
    report.test_values.sort((a, b) =>
      (a.test_parameters?.sort_order || 0) - (b.test_parameters?.sort_order || 0)
    );
  }

  return res.json({ data: report });
}

// ─── Update report status (state machine) ─────────────────────────────────
async function updateStatus(req, res) {
  const lab_id    = req.user.lab_id;
  const report_id = req.params.id;
  const { status: newStatus } = req.body;

  const { data: report, error } = await supabase
    .from('reports')
    .select('id, status, patient_id, lab_id, test_panels ( name )')
    .eq('id', report_id)
    .eq('lab_id', lab_id)
    .single();

  if (error || !report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  // Enforce forward-only state machine
  const expectedNextStatus = VALID_TRANSITIONS[report.status];
  if (newStatus !== expectedNextStatus) {
    return res.status(400).json({
      error: `Invalid status transition. Current: '${report.status}'. Next allowed: '${expectedNextStatus}'.`,
    });
  }

  // Receptionists (and managers/administrators) can release reports.
  if (newStatus === 'released' && !['administrator', 'manager', 'receptionist'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only administrators, managers, and receptionists can release reports.' });
  }

  const update = { status: newStatus };
  if (newStatus === 'released') {
    update.reported_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from('reports')
    .update(update)
    .eq('id', report_id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });

  if (newStatus === 'released') {
    try {
      // Regenerate PDF first to get the fresh URL
      const freshUrl = await generateAndUploadPDF(report_id);
      if (freshUrl) {
        updated.pdf_url = freshUrl;
      }

      const { data: patient } = await supabase
        .from('patients')
        .select('full_name, phone')
        .eq('id', report.patient_id)
        .single();

      const { data: lab } = await supabase
        .from('labs')
        .select('name')
        .eq('id', lab_id)
        .single();

      if (patient?.phone) {
        const portalUrl = `${process.env.FRONTEND_URL}/reports`;
        sendReportReady(
          patient.phone,
          patient.full_name?.split(' ')[0] || 'Patient',
          lab?.name || 'Lab',
          updated.pdf_url || portalUrl
        );
      }
    } catch (err) {
      logger.error(`Post-release tasks failed for report ${report_id}: ${err.message}`);
    }
  }

  res.json({ data: updated });
}

// ─── Manually retrigger Gemini insight ────────────────────────────────────
async function regenerateInsights(req, res) {
  const lab_id    = req.user.lab_id;
  const report_id = req.params.id;

  const { data: report } = await supabase
    .from('reports')
    .select(`
      id,
      patients ( full_name, gender, date_of_birth ),
      test_panels ( name ),
      test_values (
        value, flag,
        test_parameters ( name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female )
      )
    `)
    .eq('id', report_id)
    .eq('lab_id', lab_id)
    .single();

  if (!report) return res.status(404).json({ error: 'Report not found.' });

  res.json({ message: 'Insight regeneration triggered.' });

  // Run async
  (async () => {
    try {
      const patient = report.patients;
      const dob = patient?.date_of_birth ? new Date(patient.date_of_birth) : null;
      const age = dob
        ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
        : 'Unknown';

      const insightInput = report.test_values.map(tv => ({
        name:    tv.test_parameters?.name  || '',
        value:   tv.value,
        unit:    tv.test_parameters?.unit  || '',
        ref_min: patient?.gender === 'female'
          ? tv.test_parameters?.ref_min_female
          : tv.test_parameters?.ref_min_male,
        ref_max: patient?.gender === 'female'
          ? tv.test_parameters?.ref_max_female
          : tv.test_parameters?.ref_max_male,
        flag: tv.flag,
      }));

      const insight = await generateInsight(
        { age, gender: patient?.gender || 'unknown' },
        report.test_panels,
        insightInput
      );

      await supabase.from('report_insights').upsert({
        report_id,
        summary:        insight.summary,
        findings:       insight.findings,
        recommendation: insight.recommendation,
        model_used:     'gemini-1.5-flash',
      }, { onConflict: 'report_id' });

      logger.info(`Insight regenerated for report ${report_id}`);
    } catch (err) {
      logger.error(`Insight regeneration failed for ${report_id}: ${err.message}`);
    }
  })();
}

// ─── Manually retrigger PDF generation ───────────────────────────────────
async function generatePdf(req, res) {
  const lab_id    = req.user.lab_id;
  const report_id = req.params.id;

  const { data: report } = await supabase
    .from('reports')
    .select('id')
    .eq('id', report_id)
    .eq('lab_id', lab_id)
    .single();

  if (!report) return res.status(404).json({ error: 'Report not found.' });

  res.json({ message: 'PDF generation triggered.' });
  generateAndUploadPDF(report_id);
}

// ─── Get fresh signed PDF URL ─────────────────────────────────────────────
async function downloadReport(req, res) {
  const lab_id    = req.user.lab_id;
  const report_id = req.params.id;

  const { data: report, error } = await supabase
    .from('reports')
    .select('id, pdf_url')
    .eq('id', report_id)
    .eq('lab_id', lab_id)
    .single();

  if (error || !report) return res.status(404).json({ error: 'Report not found.' });
  if (!report.pdf_url) return res.status(404).json({ error: 'PDF not yet generated.' });

  try {
    const fileName = `${report_id}.pdf`;
    const freshUrl = await getSignedUrl(fileName);
    // Update the stored URL with fresh expiry
    await supabase.from('reports').update({ pdf_url: freshUrl }).eq('id', report_id);
    return res.json({ url: freshUrl });
  } catch (err) {
    return res.status(500).json({ error: 'Could not generate download URL.' });
  }
}

// ─── Public share link for doctors (no auth) ─────────────────────────────
async function shareReport(req, res) {
  const { token } = req.params;

  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      id, status, collected_at, reported_at, pdf_url,
      patients ( full_name, date_of_birth, gender ),
      labs ( name, logo_url, primary_color, address, phone ),
      test_panels ( name, short_code ),
      test_values (
        value, flag,
        test_parameters ( name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female, sort_order )
      ),
      report_insights ( summary, findings, recommendation )
    `)
    .eq('share_token', token)
    .eq('status', 'released')
    .single();

  if (error || !report) {
    return res.status(404).json({ error: 'Report not found or not yet released.' });
  }

  // Refresh the signed URL if it exists, so patient portal gets a fresh 24h link
  if (report.pdf_url) {
    try {
      const freshUrl = await getSignedUrl(`${report.id}.pdf`);
      report.pdf_url = freshUrl;
      // Fire and forget update to db
      supabase.from('reports').update({ pdf_url: freshUrl }).eq('id', report.id).then();
    } catch (e) {
      logger.error(`Failed to refresh signed url in shareReport for ${report.id}: ${e.message}`);
    }
  }

  return res.json({ data: report });
}

module.exports = {
  listReports,
  createReport,
  getReport,
  updateStatus,
  regenerateInsights,
  generatePdf,
  downloadReport,
  shareReport,
};
