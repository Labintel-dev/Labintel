'use strict';
const nodemailer = require('nodemailer');

// ── Transporter ─────────────────────────────────────────────────────────────
// Configure once and reuse. Reads SMTP_* variables from server/.env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Generic send helper.
 * @param {{ to: string, subject: string, text?: string, html?: string }} options
 * @returns {Promise<nodemailer.SentMessageInfo>}
 */
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not configured. Set SMTP_USER and SMTP_PASS in server/.env');
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return info;
}

// ── Pre-built email helpers ──────────────────────────────────────────────────

/**
 * Send a welcome email after user registration.
 * @param {{ name: string, email: string }} user
 */
async function sendWelcomeEmail({ name, email }) {
  return sendEmail({
    to: email,
    subject: 'Welcome to LabIntel 🧪',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h1 style="color:#4f46e5;margin-bottom:8px;">Welcome to LabIntel, ${name}! 👋</h1>
        <p style="color:#374151;font-size:15px;line-height:1.6;">
          Your account has been successfully created. You can now log in and access
          your lab reports, diagnostics, and health insights — all in one place.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Go to Dashboard →
        </a>
        <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#9ca3af;font-size:12px;">LabIntel · AI-Powered Diagnostic Lab</p>
      </div>
    `,
  });
}

/**
 * Notify a patient that their lab report is ready.
 * @param {{ name: string, email: string, reportId: string }} param
 */
async function sendReportReadyEmail({ name, email, reportId }) {
  return sendEmail({
    to: email,
    subject: 'Your Lab Report is Ready 📋',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h1 style="color:#059669;margin-bottom:8px;">Your Report is Ready, ${name}!</h1>
        <p style="color:#374151;font-size:15px;line-height:1.6;">
          Lab report <strong>#${reportId}</strong> has been finalized and is now
          available for you to view in your patient portal.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          View Report →
        </a>
        <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#9ca3af;font-size:12px;">LabIntel · AI-Powered Diagnostic Lab</p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendWelcomeEmail, sendReportReadyEmail };
