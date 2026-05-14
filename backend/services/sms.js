'use strict';
const twilio = require('twilio');
const logger = require('../logger');

const TWILIO_ACCOUNT_SID = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
const TWILIO_AUTH_TOKEN = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
const FROM_NUMBER = String(process.env.TWILIO_PHONE_NUMBER || '').trim();

// Initialize Twilio client once — reused across all calls
const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

/**
 * Core SMS sender — all other functions call this
 */
async function sendSMS(to, body) {
  if (!client || !FROM_NUMBER) {
    logger.error('SMS configuration is missing. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
    throw new Error('SMS service is not configured.');
  }

  // Format Indian numbers to E.164 (+91XXXXXXXXXX)
  // Twilio requires international format
  let toFormatted = to.toString().trim();
  if (!toFormatted.startsWith('+')) {
    // Remove leading 0 if present, then prepend +91 for India
    toFormatted = '+91' + toFormatted.replace(/^0/, '');
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: FROM_NUMBER,
      to: toFormatted,
    });

    logger.info('SMS sent', { sid: message.sid, to: toFormatted });
    return message;
  } catch (err) {
    logger.error(`SMS send failed for ${toFormatted}: ${err.message}`);
    throw err;
  }
}

/**
 * Called when manager/receptionist releases a report
 * Sends direct signed PDF URL for immediate download/view
 * @param {string} phone - Patient phone number
 * @param {object} options - { patientName, labName, pdfUrl }
 * @returns {Promise} Twilio message object
 */
// 
async function sendReportReady(phone, {
  patientName,
  labName,
}) {

  const reportLink =
    'https://labintelorg.vercel.app/patient';

  const body =
    `Hi ${patientName}, your lab report from ${labName} is now ready.\n\n` +
    `View Report:\n${reportLink}\n\n` +
    `For any queries, contact your lab directly.`;

  logger.info(`Sending report ready SMS to ${phone}`);

  return sendSMS(phone, body);
}
// async function sendReportReady(phone, {
//   patientName,
//   labName,
//   reportLink,
// }) {

//   const body =
//     `Hi ${patientName}, your lab report from ${labName} is now ready.\n\n` +
//     `View Report:\n${reportLink}`;

//   logger.info(`Sending SMS to ${phone}`);

//   return sendSMS(phone, body);
// }
/**
 * OTP for patient portal login (existing feature)
 */
async function sendOTP(phone, otp) {
  const body = `Your LabIntel OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`;
  return sendSMS(phone, body);
}

/**
 * Appointment confirmation (if you add booking system)
 */
async function sendAppointmentConfirmation(phone, { name, ref, date, time }) {
  const body =
    `Hi ${name}, your appointment is confirmed! ` +
    `Ref: ${ref} | Date: ${date} | Time: ${time}. ` +
    `Please arrive 10 minutes early.`;

  return sendSMS(phone, body);
}

module.exports = {
  sendSMS,
  sendReportReady,
  sendOTP,
  sendAppointmentConfirmation,
};