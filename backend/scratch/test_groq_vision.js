require('dotenv').config({ path: '.env' });
const Groq = require('groq-sdk');
const https = require('https');
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

https.get('https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=90', (res) => {
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    const b64 = buf.toString('base64');
    console.log('Image raw size:', (buf.length / 1024).toFixed(1), 'KB');
    console.log('Base64 size:  ', (b64.length / 1024).toFixed(1), 'KB');

    client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } },
        { type: 'text', text: 'Describe what you see in one sentence.' }
      ]}],
      temperature: 0.1
    }).then(r => {
      console.log('SUCCESS:', r.choices[0].message.content);
    }).catch(e => console.error('FAIL:', e.message, JSON.stringify(e.error || {})));
  });
}).on('error', e => console.error('Download error:', e.message));
