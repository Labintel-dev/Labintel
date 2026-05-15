/**
 * Full end-to-end test: real PDF → /ocr/analyze-report-public → Groq
 */
require('dotenv').config({ path: '.env' });
const https = require('https');
const http  = require('http');

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading real PDF...');
  const buf = await downloadBuffer('https://www.orimi.com/pdf-test.pdf');
  const b64 = 'data:application/pdf;base64,' + buf.toString('base64');
  console.log('PDF base64 size:', (b64.length / 1024).toFixed(1), 'KB');
  console.log('Sending to OCR endpoint...');

  const body = JSON.stringify({ image: b64, mimeType: 'application/pdf' });

  await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3001,
      path: '/api/v1/ocr/analyze-report-public',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log('\n--- RESPONSE ---');
        console.log('HTTP Status:', res.statusCode);
        try {
          const parsed = JSON.parse(data);
          console.log('type     :', parsed.type);
          console.log('riskLevel:', parsed.riskLevel);
          console.log('summary  :', parsed.summary);
          console.log('params   :', parsed.results?.parameters?.length, 'parameters');
          console.log('medicines:', parsed.results?.medicines?.length, 'medicines');
          console.log('advice   :', parsed.advice);
        } catch {
          console.log('Raw:', data.slice(0, 600));
        }
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

main().catch(e => console.error('FATAL:', e.message));
