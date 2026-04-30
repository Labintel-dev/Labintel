'use strict';
/**
 * pdf.js - Puppeteer PDF generation pipeline.
 * Runs fully async; callers fire-and-forget.
 * The report is usable even if this fails (pdf_url stays null).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const supabase = require('../db/supabase');
const { uploadPDF } = require('./storage');
const logger = require('../logger');

const TEMPLATE_PATH = path.join(__dirname, '../templates/report.html');
const PDF_LOGO_PATH = path.join(__dirname, '../assets/logo.jpg');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(value) {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buildBarcodeSvg(text) {
  const source = String(text || 'LABINTEL').replace(/\s+/g, '').toUpperCase();
  const bars = [];
  let x = 8;
  for (let i = 0; i < source.length; i += 1) {
    const code = source.charCodeAt(i);
    const widths = [1, 2, 1, 3, 2, 1, 2].map((n, idx) => n + ((code >> idx) & 1));
    widths.forEach((width, idx) => {
      if (idx % 2 === 0) {
        bars.push(`<rect x="${x}" y="4" width="${width}" height="46" fill="#111"/>`);
      }
      x += width + 1;
    });
    x += 2;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.max(180, x + 8)} 62" aria-label="Barcode">
      <rect width="100%" height="100%" fill="#fff"/>
      ${bars.join('')}
      <text x="50%" y="59" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="8" fill="#444">${escapeHtml(source)}</text>
    </svg>
  `;
}



function buildMicroscopeIconSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-label="Microscope">
      <circle cx="32" cy="32" r="32" fill="#0f5db8"/>
      <path d="M25 16h8l6 8-4 3-7-8-3 2-3-3z" fill="#fff"/>
      <path d="M36 29c4 0 8 3 9 8h4v4H20v-4h7c0-4 3-8 9-8z" fill="#fff"/>
      <path d="M22 42h26v4H22zM29 24l9 11-4 3-9-11z" fill="#fff"/>
      <circle cx="40" cy="22" r="3" fill="#f2c94c"/>
    </svg>
  `;
}

function buildPdfLogoMarkup(labLogoUrl) {
  try {
    if (labLogoUrl) {
      return `<img src="${labLogoUrl}" alt="Lab Logo" />`;
    }

    if (fs.existsSync(PDF_LOGO_PATH)) {
      const ext = path.extname(PDF_LOGO_PATH).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      const file = fs.readFileSync(PDF_LOGO_PATH);
      const dataUri = `data:${mimeType};base64,${file.toString('base64')}`;
      return `<img src="${dataUri}" alt="Lab Logo" />`;
    }

    return buildMicroscopeIconSvg();
  } catch (_) {
    return buildMicroscopeIconSvg();
  }
}

function buildTaglineIconSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#0f5db8" d="M8 3h3l7 7-2 2-1-1-3 3 5 5h2v2H5v-2h8l-5-5 3-3-1-1 2-2z"/>
      <path fill="#f2c94c" d="M4 18h5v2H4z"/>
    </svg>
  `;
}

function buildLabNameHtml(name) {
  const safe = escapeHtml(name || 'LABINTEL PATHOLOGY LAB');
  const match = safe.match(/^(.+?)\s+(PATHOLOGY LAB|DIAGNOSTICS|LAB)$/i);
  if (!match) return safe;
  return `${match[1]} <span class="accent">${match[2]}</span>`;
}

function normalizeValue(value) {
  if (value == null || value === '') return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return escapeHtml(value);
  if (Number.isInteger(num)) return String(num);
  return String(Number(num.toFixed(2)));
}

function getSectionName(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('hemoglobin') || n.includes('(hb)') || n === 'hb') return 'HEMOGLOBIN';
  if (n.includes('rbc')) return 'RBC COUNT';
  if (
    n.includes('pcv') ||
    n.includes('packed cell') ||
    n.includes('mcv') ||
    n.includes('mchc') ||
    n.includes('mch') ||
    n.includes('rdw') ||
    n.includes('hematocrit')
  ) return 'BLOOD INDICES';
  if (n.includes('wbc') && !n.includes('neutro') && !n.includes('lymph') && !n.includes('eos') && !n.includes('mono') && !n.includes('baso')) {
    return 'WBC COUNT';
  }
  if (
    n.includes('neutro') ||
    n.includes('lymph') ||
    n.includes('eos') ||
    n.includes('mono') ||
    n.includes('baso')
  ) return 'DIFFERENTIAL WBC COUNT';
  if (n.includes('platelet')) return 'PLATELET COUNT';
  return 'OTHER PARAMETERS';
}

function computeBorderline(flag, value, refMin, refMax) {
  if (flag && flag !== 'normal') return false;
  const num = Number(value);
  if (!Number.isFinite(num)) return false;
  if (refMin == null || refMax == null) return false;

  const span = Number(refMax) - Number(refMin);
  if (!Number.isFinite(span) || span <= 0) return false;

  const edgeDistance = Math.min(Math.abs(num - Number(refMin)), Math.abs(Number(refMax) - num));
  return edgeDistance / span <= 0.05;
}

function buildResultsTableRows(values, gender) {
  const isFemale = gender === 'female';
  const rows = [];
  let lastSection = '';

  values.forEach((tv) => {
    const parameter = tv.test_parameters || {};
    const name = parameter.name || '-';
    const section = getSectionName(name);
    const refMin = isFemale ? parameter.ref_min_female : parameter.ref_min_male;
    const refMax = isFemale ? parameter.ref_max_female : parameter.ref_max_male;
    const refText = refMin != null && refMax != null ? `${refMin} - ${refMax}` : '-';
    const borderline = computeBorderline(tv.flag, tv.value, refMin, refMax);
    const rowClass = [
      tv.flag && tv.flag !== 'normal' ? `flag-${tv.flag}` : '',
      borderline ? 'row-borderline' : '',
    ].filter(Boolean).join(' ');

    let flagLabel = '';
    if (tv.flag === 'low') flagLabel = 'Low';
    if (tv.flag === 'high') flagLabel = 'High';
    if (tv.flag === 'critical_low') flagLabel = 'Critical Low';
    if (tv.flag === 'critical_high') flagLabel = 'Critical High';
    if (!flagLabel && borderline) flagLabel = 'Borderline';

    const resultClass = tv.flag && tv.flag !== 'normal'
      ? `flag-${tv.flag}`
      : borderline
        ? 'flag-borderline'
        : '';

    const note = section === 'BLOOD INDICES' && ['MCV', 'MCH', 'MCHC'].some((item) => name.toUpperCase().includes(item))
      ? '<span class="subnote">Calculated</span>'
      : '';
    const sectionLabel = section !== lastSection
      ? `<span class="section-tag">${escapeHtml(section)}</span>`
      : '';

    lastSection = section;

    rows.push(`
      <tr class="${rowClass}">
        <td>
          ${sectionLabel}
          <span class="investigation-name">${escapeHtml(name)}</span>
          ${note}
        </td>
        <td class="result-cell ${resultClass}">
          <span class="result-value">${escapeHtml(normalizeValue(tv.value))}</span>
          ${flagLabel ? `<span class="flag-label">${escapeHtml(flagLabel)}</span>` : ''}
        </td>
        <td class="ref-cell ${resultClass}">${escapeHtml(refText)}</td>
        <td class="unit-cell">${escapeHtml(parameter.unit || '-')}</td>
      </tr>
    `);
  });

  return rows.join('');
}

function buildInterpretation(values, insight) {
  if (insight?.recommendation) return insight.recommendation;

  const hasLowHb = values.some((tv) => {
    const name = String(tv.test_parameters?.name || '').toLowerCase();
    return name.includes('hemoglobin') && ['low', 'critical_low'].includes(tv.flag);
  });

  const hasPlateletIssue = values.some((tv) => {
    const name = String(tv.test_parameters?.name || '').toLowerCase();
    return name.includes('platelet') && tv.flag && tv.flag !== 'normal';
  });

  const hasWbcIssue = values.some((tv) => {
    const name = String(tv.test_parameters?.name || '').toLowerCase();
    return name.includes('wbc') && tv.flag && tv.flag !== 'normal';
  });

  if (hasLowHb) return 'Suggestive of anemia. Clinical correlation advised.';
  if (hasPlateletIssue) return 'Platelet count requires clinical correlation.';
  if (hasWbcIssue) return 'Leukocyte pattern should be correlated with symptoms and history.';
  return 'CBC parameters are within acceptable reference limits. Clinical correlation advised.';
}



function dedupeTestValues(values) {
  const seen = new Set();

  return (values || []).filter((tv) => {
    const key = JSON.stringify([
      tv.test_parameters?.name || '',
      tv.test_parameters?.unit || '',
      tv.value ?? '',
      tv.flag || '',
      tv.test_parameters?.ref_min_male ?? '',
      tv.test_parameters?.ref_max_male ?? '',
      tv.test_parameters?.ref_min_female ?? '',
      tv.test_parameters?.ref_max_female ?? '',
    ]);

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generate and upload the PDF for a report.
 * @param {string} reportId - UUID of the report
 */
async function generateAndUploadPDF(reportId) {
  let browser;
  try {
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        id, lab_id, collected_at, reported_at, status, share_token,
        created_at, patient_id,
        labs!reports_lab_id_fkey (
          name, address, phone, logo_url, primary_color, slug
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

    const lab = report.labs || {};
    const patient = report.patients || {};
    const panel = report.test_panels || {};
    const tech = report.lab_staff || {};
    const insight = report.report_insights || {};

    const { data: labPatient } = await supabase
      .from('lab_patients')
      .select('lab_patient_code, referred_by, registered_at')
      .eq('lab_id', report.lab_id)
      .eq('patient_id', report.patient_id)
      .maybeSingle();

    const dob = patient.date_of_birth ? new Date(patient.date_of_birth) : null;
    const age = dob
      ? `${Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))} Years`
      : 'N/A';

    const sortedValues = dedupeTestValues(report.test_values).sort(
      (a, b) => (a.test_parameters?.sort_order || 0) - (b.test_parameters?.sort_order || 0)
    );

    const templateRaw = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const labName = lab.name || 'LABINTEL PATHOLOGY LAB';
    const reportCode = labPatient?.lab_patient_code
      || (report.patient_id ? report.patient_id.slice(-6).toUpperCase() : report.id.slice(-6).toUpperCase());
    const barcodeText = `RPT${report.id.slice(0, 8).toUpperCase()}`;
    const website = 'labintel.in';
    const email = lab.slug ? `reports@${lab.slug}.com` : 'reports@labintel.in';
    const referredBy = labPatient?.referred_by || 'Self';
    const sampleCollectionAt = lab.address || 'Collection center address not available';
    const instrumentName = String(panel.name || '').toLowerCase().includes('cbc')
      ? 'Fully automated hematology analyzer'
      : 'Automated laboratory analyzer';
    const pathologistName = 'Dr. Pathologist';

    const replacements = {
      '{{PRIMARY_COLOR}}': lab.primary_color || '#0a3d91',
      '{{LAB_NAME_HTML}}': buildLabNameHtml(labName),
      '{{LAB_PHONE}}': escapeHtml(lab.phone || '+91 98765 43210'),
      '{{LAB_EMAIL}}': escapeHtml(email),
      '{{LAB_ADDRESS}}': escapeHtml(lab.address || 'Address not available'),
      '{{LAB_WEBSITE}}': escapeHtml(website),
      '{{LAB_ICON}}': buildPdfLogoMarkup(lab.logo_url),
      '{{TAGLINE_ICON}}': buildTaglineIconSvg(),
      '{{BARCODE_SVG}}': buildBarcodeSvg(barcodeText),
      '{{BARCODE_TEXT}}': escapeHtml(barcodeText),
      '{{PATIENT_NAME}}': escapeHtml(patient.full_name || 'Unknown Patient'),
      '{{PATIENT_AGE}}': escapeHtml(age),
      '{{PATIENT_GENDER}}': escapeHtml(
        patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'
      ),
      '{{REG_NO}}': escapeHtml(reportCode),
      '{{SAMPLE_COLLECTION_AT}}': escapeHtml(sampleCollectionAt),
      '{{REFERRED_BY}}': escapeHtml(referredBy),
      '{{REGISTERED_DATE}}': escapeHtml(formatDateTime(labPatient?.registered_at || report.created_at)),
      '{{COLLECTED_DATE}}': escapeHtml(formatDateTime(report.collected_at)),
      '{{REPORTED_DATE}}': escapeHtml(formatDateTime(report.reported_at)),
      '{{PANEL_NAME}}': escapeHtml(panel.name || 'Complete Blood Count (CBC)'),
      '{{TEST_VALUES_TABLE}}': buildResultsTableRows(sortedValues, patient.gender),
      '{{INSTRUMENT_NAME}}': escapeHtml(instrumentName),
      '{{INTERPRETATION}}': escapeHtml(buildInterpretation(sortedValues, insight)),

      '{{TECHNICIAN_NAME}}': escapeHtml(tech.full_name || 'Lab Technician'),
      '{{PATHOLOGIST_NAME}}': escapeHtml(pathologistName),
      '{{GENERATED_AT}}': escapeHtml(formatDateTime(new Date())),
      '{{REPORT_ID}}': escapeHtml(report.id),
    };

    const html = Object.entries(replacements).reduce(
      (acc, [placeholder, value]) => {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        return acc.replace(regex, () => value); // Using function to avoid special char interpretation in value
      },
      templateRaw
    );

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: 'new',
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    try {
      const debugDir = path.join(__dirname, '../scratch');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
      await page.screenshot({ path: path.join(debugDir, 'debug.png'), fullPage: true });
      fs.writeFileSync(path.join(debugDir, 'debug.pdf'), pdfBuffer);
      logger.info('DEBUG: Saved debug.png and debug.pdf to scratch folder');
    } catch (e) {
      logger.error('DEBUG screenshot/pdf save failed: ' + e.message);
    }

    await browser.close();
    browser = null;

    const fileName = `${report.id}.pdf`;
    const signedUrl = await uploadPDF(fileName, pdfBuffer);

    await supabase.from('reports').update({ pdf_url: signedUrl }).eq('id', reportId);

    logger.info(`PDF generated and uploaded for report ${reportId}`);
    return signedUrl;
  } catch (err) {
    logger.error(`PDF generation failed for report ${reportId}: ${err.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {
        // ignore
      }
    }
  }
}

module.exports = { generateAndUploadPDF };
