/**
 * Test pdf-parse with a real downloadable PDF from a reliable CDN
 */
require('dotenv').config({ path: '.env' });
const pdfParse = require('pdf-parse');
const https = require('https');

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
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
  // Download a real simple PDF - using a known reliable source
  const url = 'https://www.orimi.com/pdf-test.pdf';
  console.log('Downloading:', url);
  
  const buf = await downloadBuffer(url);
  console.log('Buffer size:', (buf.length / 1024).toFixed(1), 'KB');
  console.log('First 5 bytes:', buf.slice(0, 5).toString());

  if (!buf.slice(0, 4).toString().startsWith('%PDF')) {
    console.error('Not a valid PDF!');
    return;
  }

  const data = await pdfParse(buf);
  console.log('\n✅ pdf-parse SUCCESS');
  console.log('Pages:', data.numpages);
  console.log('Text length:', data.text.length);
  console.log('Text:\n', data.text.slice(0, 500));
}

main().catch(e => console.error('FAIL:', e.message));
