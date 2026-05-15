/**
 * End-to-end test: hit the actual /ocr/analyze-report-public endpoint
 * with a real base64 JPEG and check the response.
 */
require('dotenv').config({ path: '.env' });
const https = require('https');
const http  = require('http');

https.get('https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80', (res) => {
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const b64 = 'data:image/jpeg;base64,' + Buffer.concat(chunks).toString('base64');
    console.log('Sending image to /ocr/analyze-report-public ...');

    const body = JSON.stringify({ image: b64, mimeType: 'image/jpeg' });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/ocr/analyze-report-public',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res2) => {
      let data = '';
      res2.on('data', d => data += d);
      res2.on('end', () => {
        console.log('Status:', res2.statusCode);
        try {
          const parsed = JSON.parse(data);
          console.log('type:     ', parsed.type);
          console.log('riskLevel:', parsed.riskLevel);
          console.log('summary:  ', (parsed.summary || '').slice(0, 120));
          console.log('params:   ', parsed.results?.parameters?.length ?? 0, 'parameters');
          console.log('medicines:', parsed.results?.medicines?.length ?? 0, 'medicines');
        } catch (e) {
          console.log('Raw response:', data.slice(0, 500));
        }
      });
    });

    req.on('error', e => console.error('Request error:', e.message));
    req.write(body);
    req.end();
  });
}).on('error', e => console.error('Image download error:', e.message));
