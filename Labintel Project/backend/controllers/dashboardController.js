'use strict';
const supabase = require('../db/supabase');
const logger = require('../logger');

// ─── Technician / Staff Dashboard ─────────────────────────────────────────
// Returns KPIs and recent reports scoped to the logged-in staff member.
// All roles can access this (technician, receptionist, manager/admin).
async function getStaffDashboard(req, res) {
  const lab_id     = req.user.lab_id;
  const staff_id   = req.user.id;
  const role       = req.user.role;
  const now        = new Date();
  const today      = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  try {
    // ── KPI 1: Reports today (created by this staff member) ──────────────
    const { count: reportsToday } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', lab_id)
      .eq('created_by', staff_id)
      .gte('created_at', today);

    // ── KPI 2: In review (created by this staff, awaiting admin release) ──
    const { count: inReview } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', lab_id)
      .eq('created_by', staff_id)
      .eq('status', 'in_review');

    // ── KPI 3: Draft (incomplete entries by this staff) ───────────────────
    const { count: drafts } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', lab_id)
      .eq('created_by', staff_id)
      .eq('status', 'draft');

    // ── KPI 4: Critical flags (reports by this staff with critical values) ─
    // We need to count reports that have at least one critical test_value
    const { data: criticalReports } = await supabase
      .from('test_values')
      .select('report_id, reports!inner(lab_id, created_by)')
      .eq('reports.lab_id', lab_id)
      .eq('reports.created_by', staff_id)
      .in('flag', ['critical_low', 'critical_high']);

    // Count unique report IDs with critical flags
    const criticalReportIds = new Set((criticalReports || []).map(r => r.report_id));
    const criticalFlags = criticalReportIds.size;

    // ── Recent reports (last 10 by this staff) ───────────────────────────
    const { data: recentReports, error: reportsError } = await supabase
      .from('reports')
      .select(`
        id, status, collected_at, created_at,
        patients ( id, full_name, phone ),
        test_panels ( id, name, short_code ),
        test_values ( flag )
      `)
      .eq('lab_id', lab_id)
      .eq('created_by', staff_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reportsError) {
      logger.error(`Dashboard reports query failed: ${reportsError.message}`);
    }

    // Process reports to include flag summary
    const reports = (recentReports || []).map(r => {
      const flags = (r.test_values || []).map(tv => tv.flag);
      const criticalCount = flags.filter(f => f === 'critical_low' || f === 'critical_high').length;
      const highCount = flags.filter(f => f === 'high').length;
      const lowCount = flags.filter(f => f === 'low').length;
      const normalCount = flags.filter(f => f === 'normal').length;

      let flagSummary = 'All normal';
      let flagType = 'normal';

      if (criticalCount > 0) {
        flagSummary = `${criticalCount} critical`;
        flagType = 'critical';
      } else if (highCount > 0 && lowCount > 0) {
        flagSummary = `${highCount} high, ${lowCount} low`;
        flagType = 'high';
      } else if (highCount > 0) {
        flagSummary = `${highCount} high`;
        flagType = 'high';
      } else if (lowCount > 0) {
        flagSummary = `${lowCount} low`;
        flagType = 'low';
      }

      return {
        id: r.id,
        status: r.status,
        collected_at: r.collected_at,
        created_at: r.created_at,
        patient: r.patients,
        test_panel: r.test_panels,
        flag_summary: flagSummary,
        flag_type: flagType,
      };
    });

    // ── Get lab_patient_code for each patient ────────────────────────────
    // Fetch codes for patient IDs in the reports
    const patientIds = [...new Set(reports.map(r => r.patient?.id).filter(Boolean))];
    let patientCodes = {};
    if (patientIds.length > 0) {
      const { data: labPatients } = await supabase
        .from('lab_patients')
        .select('patient_id, lab_patient_code')
        .eq('lab_id', lab_id)
        .in('patient_id', patientIds);

      (labPatients || []).forEach(lp => {
        patientCodes[lp.patient_id] = lp.lab_patient_code;
      });
    }

    // Attach patient codes to reports
    reports.forEach(r => {
      if (r.patient) {
        r.patient_code = patientCodes[r.patient.id] || null;
      }
    });

    return res.json({
      data: {
        kpi: {
          reports_today: reportsToday || 0,
          in_review: inReview || 0,
          drafts: drafts || 0,
          critical_flags: criticalFlags,
        },
        reports,
        staff_name: req.user.full_name,
        role,
      },
    });
  } catch (err) {
    logger.error(`Staff dashboard failed: ${err.message}`);
    return res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
}

module.exports = { getStaffDashboard };
