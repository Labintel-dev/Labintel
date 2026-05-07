'use strict';
const supabase = require('../db/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../services/sms');
const { generateDetailedInsight, translateTextToHindi } = require('../services/aiService');
const { getSignedUrl } = require('../services/storage');
const { generateAndUploadPDF } = require('../services/pdf');
const logger = require('../logger');

async function getPatientLabMap(patient_id) {
  const { data, error } = await supabase
    .from('lab_patients')
    .select('id, lab_id, lab_patient_code')
    .eq('patient_id', patient_id);

  if (error) throw error;

  const map = new Map();
  for (const row of data || []) {
    map.set(row.lab_id, {
      id: row.id,
      lab_patient_code: row.lab_patient_code,
    });
  }
  return map;
}

async function getMyReports(req, res) {
  const patient_id = req.user.patient_id;

  try {
    const labMap = await getPatientLabMap(patient_id);
    const labIds = [...labMap.keys()];
    if (labIds.length === 0) return res.json({ data: [] });

    const { data, error } = await supabase
      .from('reports')
      .select(`
        id, lab_id, reported_at, collected_at, status, pdf_url, share_token, created_at,
        labs!reports_lab_id_fkey ( name, logo_url, primary_color ),
        test_panels ( name, short_code )
      `)
      .eq('patient_id', patient_id)
      .in('lab_id', labIds)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const reports = (data || []).map((report) => ({
      ...report,
      lab_patient: labMap.get(report.lab_id) || null,
    }));

    return res.json({ data: reports });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getMyReport(req, res) {
  const patient_id = req.user.patient_id;
  const report_id  = req.params.id;
  const requestedLang = String(req.query?.lang || '').toLowerCase();

  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      id, lab_id, collected_at, reported_at, status, pdf_url, share_token,
      labs!reports_lab_id_fkey ( name, logo_url, primary_color, address, phone ),
      patients ( id, full_name, date_of_birth, gender ),
      test_panels ( name, short_code ),
      test_values (
        id, value, flag,
        test_parameters ( id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female, sort_order )
      ),
      report_insights ( summary, findings, recommendation )
    `)
    .eq('id', report_id)
    .eq('patient_id', patient_id)
    .single();

  if (error || !report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const { data: labPatient } = await supabase
    .from('lab_patients')
    .select('id, lab_patient_code')
    .eq('lab_id', report.lab_id)
    .eq('patient_id', patient_id)
    .maybeSingle();

  if (!labPatient) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  report.lab_patient = labPatient;

  if (report.test_values) {
    report.test_values.sort((a, b) =>
      (a.test_parameters?.sort_order || 0) - (b.test_parameters?.sort_order || 0)
    );
  }

  try {
    const patient = report.patients || {};
    const dob = patient.date_of_birth ? new Date(patient.date_of_birth) : null;
    const age = dob
      ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
      : 'Unknown';

    const insightInput = (report.test_values || []).map((tv) => {
      const p = tv.test_parameters || {};
      const isFemale = patient.gender === 'female';
      return {
        name: p.name || 'Unknown',
        value: tv.value,
        unit: p.unit || '',
        ref_min: isFemale ? p.ref_min_female : p.ref_min_male,
        ref_max: isFemale ? p.ref_max_female : p.ref_max_male,
        flag: tv.flag || 'normal',
      };
    });

    const existingInsight = Array.isArray(report.report_insights)
      ? (report.report_insights[0] || {})
      : (report.report_insights || {});

    report.ai_analysis = await generateDetailedInsight(
      { age, gender: patient.gender || 'unknown', full_name: patient.full_name || '' },
      { name: report.test_panels?.name || 'Diagnostic Panel' },
      insightInput,
      {
        summary: existingInsight.summary,
        findings: existingInsight.findings,
        recommendation: existingInsight.recommendation,
      }
    );

    if (['hi', 'hindi', 'hi-in'].includes(requestedLang)) {
      if (report.ai_analysis?.summary) {
        report.ai_analysis.summary = await translateTextToHindi(report.ai_analysis.summary);
      }

      const firstInsight = Array.isArray(report.report_insights)
        ? (report.report_insights[0] || null)
        : (report.report_insights || null);

      if (firstInsight && firstInsight.summary) {
        firstInsight.summary = await translateTextToHindi(firstInsight.summary);
      }
    }
  } catch (err) {
    logger.error(`Detailed AI analysis failed for report ${report_id}: ${err.message}`);
  }

  return res.json({ data: report });
}

async function downloadMyReport(req, res) {
  const patient_id = req.user.patient_id;
  const report_id = req.params.id;

  const { data: report, error } = await supabase
    .from('reports')
    .select('id, pdf_url, status')
    .eq('id', report_id)
    .eq('patient_id', patient_id)
    .single();

  if (error || !report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const toAbsoluteUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.SUPABASE_URL || '';
    if (url.startsWith('/')) {
      if (base && url.startsWith('/object/')) return `${base}/storage/v1${url}`;
      return base ? `${base}${url}` : url;
    }
    if (base && url.startsWith('object/')) return `${base}/storage/v1/${url}`;
    if (base && url.startsWith('storage/')) return `${base}/${url}`;
    return url;
  };

  try {
    const fileName = `${report_id}.pdf`;
    const freshUrl = await getSignedUrl(fileName);
    const absoluteFreshUrl = toAbsoluteUrl(freshUrl);
    await supabase.from('reports').update({ pdf_url: absoluteFreshUrl }).eq('id', report_id);
    return res.json({ url: absoluteFreshUrl });
  } catch (err) {
    try {
      // If URL is missing/expired or object is absent, generate PDF on demand.
      const generatedUrl = await generateAndUploadPDF(report_id);
      const absoluteGeneratedUrl = toAbsoluteUrl(generatedUrl);
      if (absoluteGeneratedUrl) {
        await supabase.from('reports').update({ pdf_url: absoluteGeneratedUrl }).eq('id', report_id);
        return res.json({ url: absoluteGeneratedUrl });
      }
    } catch (_) {
      // Fall through to legacy fallback below.
    }

    const fallbackUrl = toAbsoluteUrl(report.pdf_url);
    if (fallbackUrl && /^https?:\/\//i.test(fallbackUrl)) {
      return res.json({ url: fallbackUrl });
    }

    return res.status(404).json({ error: 'PDF not yet generated.' });
  }
}

async function getMyTrends(req, res) {
  const patient_id = req.user.patient_id;

  let labIds;
  try {
    labIds = [...(await getPatientLabMap(patient_id)).keys()];
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  if (labIds.length === 0) return res.json({ data: [] });

  const { data: values, error } = await supabase
    .from('test_values')
    .select(`
      value, flag,
      test_parameters ( id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female ),
      reports!inner ( collected_at, status, patient_id, lab_id )
    `)
    .eq('reports.patient_id', patient_id)
    .eq('reports.status', 'released')
    .in('reports.lab_id', labIds)
    .order('reports.collected_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

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

// ─── Patient: Send Link Phone OTP ──────────────────────────────────────────
async function sendLinkPhoneOtp(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const { error } = await supabase.from('otp_sessions').upsert(
    { phone, hashed_otp: hashedOtp, expires_at: expiresAt.toISOString(), attempts: 0 },
    { onConflict: 'phone' }
  );

  if (error) {
    logger.error(`Failed to create link OTP session for ${phone}: ${error.message}`);
    return res.status(500).json({ error: 'Could not create OTP session. Try again.' });
  }

  sendOTP(phone, otp);
  logger.info(`Link OTP sent to ${phone}`);
  return res.json({ message: 'OTP sent successfully.' });
}

// ─── Patient: Verify Link Phone OTP ────────────────────────────────────────
async function verifyLinkPhoneOtp(req, res) {
  const current_patient_id = req.user.patient_id;
  const current_email = req.user.email; // From JWT
  const { phone, otp } = req.body;

  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required.' });

  const { data: session, error: sessionError } = await supabase
    .from('otp_sessions')
    .select('*')
    .eq('phone', phone)
    .single();

  if (sessionError || !session) return res.status(404).json({ error: 'No OTP session found. Please request a new OTP.' });
  if (new Date() > new Date(session.expires_at)) {
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return res.status(410).json({ error: 'OTP has expired.' });
  }
  if (session.attempts >= 3) {
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return res.status(429).json({ error: 'Too many incorrect attempts.' });
  }

  const isValid = await bcrypt.compare(otp, session.hashed_otp);
  if (!isValid) {
    await supabase.from('otp_sessions').update({ attempts: session.attempts + 1 }).eq('phone', phone);
    return res.status(401).json({ error: 'Incorrect OTP.' });
  }

  await supabase.from('otp_sessions').delete().eq('phone', phone);

  const { data: targetPatient } = await supabase
    .from('patients')
    .select('id, email, phone, full_name')
    .eq('phone', phone)
    .single();

  let finalPatient;

  if (targetPatient) {
    if (targetPatient.email && targetPatient.email !== current_email) {
      return res.status(409).json({ error: 'This phone number is already linked to another email account.' });
    }
    
    const { data: updatedTarget } = await supabase
      .from('patients')
      .update({ email: current_email })
      .eq('id', targetPatient.id)
      .select()
      .single();
    
    finalPatient = updatedTarget;

    if (current_patient_id !== targetPatient.id) {
       await supabase.from('patients').delete().eq('id', current_patient_id);
    }
  } else {
    const { data: updatedCurrent, error: updateErr } = await supabase
      .from('patients')
      .update({ phone })
      .eq('id', current_patient_id)
      .select()
      .single();
      
    if (updateErr) {
      return res.status(500).json({ error: 'Failed to link phone number.' });
    }
    finalPatient = updatedCurrent;
  }

  const token = jwt.sign(
    { patient_id: finalPatient.id, phone: finalPatient.phone, email: finalPatient.email, role: 'patient' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    message: 'Phone number linked successfully!',
    token,
    patient: { id: finalPatient.id, email: finalPatient.email, phone: finalPatient.phone, full_name: finalPatient.full_name },
  });
}

module.exports = {
  getMyReports,
  getMyReport,
  downloadMyReport,
  getMyTrends,
  getMyProfile,
  updateMyProfile,
  sendLinkPhoneOtp,
  verifyLinkPhoneOtp,
};
