'use strict';
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../templates/report.html');

(async () => {
  let browser;
  try {
    let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    const barcodeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 62"><rect width="100%" height="100%" fill="white"/><rect x="8" y="4" width="2" height="46" fill="#111"/></svg>';
    const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#0f5db8"/></svg>';
    const taglineSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"></svg>';

    const replacements = {
      '{{LAB_NAME_HTML}}': 'Test PATHOLOGY LAB',
      '{{LAB_PHONE}}': '+91 99999 99999',
      '{{LAB_EMAIL}}': 'test@lab.com',
      '{{LAB_ADDRESS}}': '123 Test Street, City',
      '{{LAB_WEBSITE}}': 'www.testlab.com',
      '{{LAB_ICON}}': iconSvg,
      '{{TAGLINE_ICON}}': taglineSvg,
      '{{BARCODE_SVG}}': barcodeSvg,
      '{{BARCODE_TEXT}}': 'RPT00000001',
      '{{PATIENT_NAME}}': 'John Doe',
      '{{PATIENT_AGE}}': '35 Years',
      '{{PATIENT_GENDER}}': 'Male',
      '{{REG_NO}}': 'PID001',
      '{{SAMPLE_COLLECTION_AT}}': 'Main Branch',
      '{{REFERRED_BY}}': 'Dr. Smith',
      '{{REGISTERED_DATE}}': '01 Jan 2025, 10:00 AM',
      '{{COLLECTED_DATE}}': '01 Jan 2025, 11:00 AM',
      '{{REPORTED_DATE}}': '01 Jan 2025, 12:00 PM',
      '{{PANEL_NAME}}': 'Complete Blood Count (CBC)',
      '{{TEST_VALUES_TABLE}}': '<tr><td><span class="investigation-name">Hemoglobin</span></td><td class="result-cell"><span class="result-value">13.5</span></td><td class="ref-cell">12.0 - 16.0</td><td class="unit-cell">g/dL</td></tr>',
      '{{INSTRUMENT_NAME}}': 'Automated hematology analyzer',
      '{{INTERPRETATION}}': 'All values within normal range.',
      '{{PATIENT_AI_SUMMARY}}': 'Your CBC results look normal.',
      '{{TECHNICIAN_NAME}}': 'Lab Tech',
      '{{PATHOLOGIST_NAME}}': 'Dr. Pathologist',
      '{{GENERATED_AT}}': '01 Jan 2025, 12:00 PM',
      '{{REPORT_ID}}': 'test-report-001',
    };

    html = Object.entries(replacements).reduce(
      (acc, [placeholder, value]) =>
        acc.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value),
      html
    );

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: 'new',
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const buf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    const outPath = path.join(__dirname, 'test_output.pdf');
    fs.writeFileSync(outPath, buf);
    console.log('PDF generated OK, bytes:', buf.length);
    console.log('Saved to:', outPath);
    await browser.close();
  } catch (e) {
    console.error('ERROR:', e.message);
    if (browser) { try { await browser.close(); } catch (_) {} }
    process.exit(1);
  }
})();
