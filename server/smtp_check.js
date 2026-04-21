const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load environment variables exactly like the server does
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

console.log('--- LabIntel SMTP Diagnostic Tool ---');
console.log(`Time: ${new Date().toISOString()}`);

const config = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '********' : 'MISSING',
  },
};

console.log('Configuration Check:');
console.log(`- Host: ${config.host}`);
console.log(`- Port: ${config.port}`);
console.log(`- User: ${config.host === 'smtp-relay.brevo.com' ? 'Brevo Relay' : config.host}`);
console.log(`- From: ${process.env.SMTP_FROM}`);

if (!process.env.SMTP_PASS) {
  console.error('❌ ERROR: SMTP_PASS is missing in your .env file!');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function runDiagnostic() {
  try {
    console.log('\n1. Verifying Connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully.');

    console.log('\n2. Sending Test Message...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'contact.labintel@gmail.com', // Sending to the company email as a test
      subject: 'LabIntel Diagnostic Test 🧪',
      text: `SMTP Diagnostic test successful.\nTime: ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#14453d;">Diagnostic Success!</h2>
          <p>If you are reading this in your Gmail, then your SMTP setup is 100% correct.</p>
          <hr/>
          <p style="font-size:12px;color:#888;">Diagnostic ID: ${Math.random().toString(36).substring(7)}</p>
        </div>
      `,
    });

    console.log('✅ Message sent successfully!');
    console.log(`- Message ID: ${info.messageId}`);
    console.log(`- Response: ${info.response}`);
    console.log('\n--- DIAGNOSTIC COMPLETE ---');
    console.log('Please check your Gmail inbox AND Spam folder.');

  } catch (error) {
    console.log('\n❌ DIAGNOSTIC FAILED');
    console.log('---------------------------');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.response) console.error('Server Response:', error.response);
    
    console.log('\nPossible Solutions:');
    if (error.code === 'EAUTH') {
      console.log('- Your SMTP_PASS might be wrong. Re-copy it from Brevo.');
    } else if (error.message.includes('Sender')) {
      console.log('- IMPORTANT: You MUST verify "contact.labintel@gmail.com" as a sender in your Brevo dashboard.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('- Port 587 might be blocked by your network/ISP. Try switching to a different internet connection.');
    }
  }
}

runDiagnostic();
