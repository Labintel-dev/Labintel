const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

async function checkPdf() {
  try {
    const dataBuffer = fs.readFileSync(path.join(__dirname, '../scratch/debug.pdf'));
    const data = await pdfParse(dataBuffer);
    console.log('PDF Text Extract:');
    console.log(data.text.substring(0, 500)); // Print first 500 chars
    console.log('Total pages:', data.numpages);
  } catch (e) {
    console.error('Failed to parse PDF:', e.message);
  }
}

checkPdf();
