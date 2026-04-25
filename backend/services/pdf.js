'use strict';
/**
 * pdf.js — Puppeteer PDF generation pipeline.
 * Runs fully async — callers fire and forget.
 * The report is usable even if this fails (pdf_url stays null).
 *
 * Pipeline (10 steps as documented):
 * 1. Fetch full report data
 * 2. Load HTML template
 * 3. Inject data ({{TOKEN}} replacements)
 * 4. Launch Puppeteer
 * 5. Set page content
 * 6. Generate A4 PDF
 * 7. Close browser (CRITICAL — prevents memory leaks)
 * 8. Upload to Supabase Storage
 * 9. Create signed URL (7-day)
 * 10. Update reports.pdf_url
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');
const supabase  = require('../db/supabase');
const { uploadPDF } = require('./storage');
const logger    = require('../logger');

const TEMPLATE_PATH = path.join(__dirname, '../templates/report.html');

/**
 * Generate and upload the PDF for a report.
 * @param {string} reportId - UUID of the report
 */
async function generateAndUploadPDF(reportId) {
  let browser;
  try {
    // ── Step 1: Fetch full report data ────────────────────────────────────
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        id, collected_at, reported_at, status, share_token,
        created_at, patient_id,
        labs!reports_lab_id_fkey (
          name, address, phone, logo_url, primary_color
        ),
        patients!reports_patient_id_fkey (
          full_name, date_of_birth, gender, phone
        ),
        test_panels!reports_panel_id_fkey (
          name, short_code
        ),
        lab_staff!reports_created_by_fkey (
          full_name
        ),
        test_values (
          value, flag,
          test_parameters (
            name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female, sort_order
          )
        ),
        report_insights (
          summary, findings, recommendation
        )
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error(`Report not found: ${reportError?.message}`);
    }

    const lab     = report.labs;
    const patient = report.patients;
    const panel   = report.test_panels;
    const tech    = report.lab_staff;
    const insight = report.report_insights;

    // Calculate age from DOB
    const dob = patient.date_of_birth ? new Date(patient.date_of_birth) : null;
    const age = dob
      ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
      : 'N/A';

    // ── Step 2: Load HTML template ─────────────────────────────────────────
    const templateRaw = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    // ── Step 3: Build test values table rows ──────────────────────────────
    const sortedValues = [...report.test_values].sort(
      (a, b) => (a.test_parameters?.sort_order || 0) - (b.test_parameters?.sort_order || 0)
    );

    const isFemale = patient.gender === 'female';
    const tableRows = sortedValues.map(tv => {
      const p      = tv.test_parameters;
      const refMin = isFemale ? p?.ref_min_female : p?.ref_min_male;
      const refMax = isFemale ? p?.ref_max_female : p?.ref_max_male;
      const refStr = (refMin != null && refMax != null) ? `${refMin} – ${refMax}` : '—';
      const flagMap = {
        normal:        { label: '',   cls: 'flag-normal' },
        low:           { label: 'L',  cls: 'flag-low' },
        high:          { label: 'H',  cls: 'flag-high' },
        critical_low:  { label: 'L*', cls: 'flag-critical' },
        critical_high: { label: 'H*', cls: 'flag-critical' },
      };
      const { label, cls } = flagMap[tv.flag] || flagMap.normal;

      return `
        <tr class="${tv.flag !== 'normal' ? 'abnormal-row' : ''}">
          <td class="col-test">${p?.name || '—'}</td>
          <td class="col-flag flag-${label.replace('*', '')}">${label}</td>
          <td class="col-val">${tv.value}</td>
          <td class="col-unit">${p?.unit || '—'}</td>
          <td class="col-ref">${refStr}</td>
        </tr>`;
    }).join('');

    // Build findings list
    const findingsList = (insight?.findings || [])
      .map(f => `<li>${f}</li>`)
      .join('');

    // ── Step 3: Token replacement ──────────────────────────────────────────
    const primaryColor = lab?.primary_color || '#1A5276';
    
    const labIntelLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32" viewBox="0 0 120 32">
      <text x="0" y="24" font-family="'Inter', Arial, sans-serif" font-size="22" font-weight="bold" fill="#0d9488">LabIntel</text>
    </svg>`;
    
    const registeredDate = report.created_at
        ? new Date(report.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })
        : 'N/A';
    const collectedDate = report.collected_at
        ? new Date(report.collected_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })
        : 'N/A';
    const reportedDate = report.reported_at
        ? new Date(report.reported_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })
        : 'N/A';

    const html = templateRaw
      .replace(/{{LABINTEL_LOGO}}/g, labIntelLogoSvg)
      .replace(/{{LAB_SLUG}}/g, lab?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'lab')
      .replace(/{{REFERRED_BY}}/g, 'Self')
      .replace(/{{REG_NO}}/g, report.patient_id ? report.patient_id.slice(-6).toUpperCase() : report.id.slice(-6).toUpperCase())
      .replace(/{{REGISTERED_DATE}}/g, registeredDate)
      .replace(/{{COLLECTED_DATE}}/g, collectedDate)
      .replace(/{{REPORTED_DATE}}/g, reportedDate)
      .replace(/{{LAB_COLOR}}/g, primaryColor)
      .replace(/{{LAB_NAME}}/g, lab?.name || 'LabIntel Diagnostics')
      .replace(/{{LAB_ADDRESS}}/g, lab?.address || '')
      .replace(/{{LAB_PHONE}}/g, lab?.phone || '')
      .replace(/{{LAB_LOGO}}/g, lab?.logo_url
        ? `<img src="${lab.logo_url}" alt="Lab Logo" class="lab-logo" />`
        : '<div class="logo-placeholder">🔬</div>')
      .replace(/{{PATIENT_NAME}}/g, patient?.full_name || 'Unknown')
      .replace(/{{PATIENT_AGE}}/g, age)
      .replace(/{{PATIENT_GENDER}}/g, patient?.gender
        ? (patient.gender === 'female' ? 'F' : (patient.gender === 'male' ? 'M' : 'O'))
        : 'N/A')
      .replace(/{{PATIENT_PHONE}}/g, patient?.phone || '')
      .replace(/{{PANEL_NAME}}/g, panel?.name || '')
      .replace(/{{PANEL_SHORT_CODE}}/g, panel?.short_code || '')
      .replace(/{{REPORT_ID}}/g, report.id)
      .replace(/{{TECHNICIAN_NAME}}/g, tech?.full_name || 'Lab Technician')
      .replace(/{{TEST_VALUES_TABLE}}/g, tableRows)
      .replace(/{{AI_SUMMARY}}/g, insight?.summary || 'AI analysis pending.')
      .replace(/{{AI_FINDINGS_LIST}}/g, findingsList || '<li>No abnormal findings noted.</li>')
      .replace(/{{AI_RECOMMENDATION}}/g, insight?.recommendation || 'Please consult your doctor.')
      .replace(/{{GENERATED_AT}}/g, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
      .replace(/{{SHARE_TOKEN}}/g, report.share_token || '');

    // ── Steps 4–7: Puppeteer ───────────────────────────────────────────────
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: 'new',
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin:          { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
    await browser.close(); // CRITICAL — prevent memory leak
    browser = null;

    // ── Steps 8–10: Upload & update ───────────────────────────────────────
    const fileName = `${report.id}.pdf`;
    const signedUrl = await uploadPDF(fileName, pdfBuffer);

    await supabase
      .from('reports')
      .update({ pdf_url: signedUrl })
      .eq('id', reportId);

    logger.info(`PDF generated and uploaded for report ${reportId}`);
    return signedUrl;

  } catch (err) {
    logger.error(`PDF generation failed for report ${reportId}: ${err.message}`);
    // Never rethrow — caller fire-and-forgot this
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) { /* ignore */ }
    }
  }
}

module.exports = { generateAndUploadPDF };
