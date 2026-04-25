'use strict';
/**
 * sms.js — Fast2SMS India SMS integration.
 * All functions are fire-and-forget.
 * A failed SMS must NEVER crash the main request or cause a 500.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios  = require('axios');
const logger = require('../logger');

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Base SMS sender — strips +91 prefix that Fast2SMS doesn't accept.
 * @param {string} phone   - +91XXXXXXXXXX format
 * @param {string} message - SMS body text
 */
async function sendSMS(phone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey || apiKey.startsWith('REPLACE')) {
    logger.warn(`SMS skipped (no API key configured): would send to ${phone}`);
    return;
  }

  // Fast2SMS requires the number without country code
  const number = phone.replace(/^\+91/, '').replace(/\s/g, '');

  try {
    const response = await axios.post(
      FAST2SMS_URL,
      {
        route:    'q',
        message,
        language: 'english',
        flash:    0,
        numbers:  number,
      },
      {
        headers:        { authorization: apiKey },
        timeout:        8000,
      }
    );

    if (response.data?.return === false) {
      logger.error(`SMS rejected by Fast2SMS for ${phone}: ${JSON.stringify(response.data)}`);
    } else {
      logger.info(`SMS sent to ${phone}`);
    }
  } catch (err) {
    // Log but NEVER throw — failed SMS must not crash anything
    logger.error(`SMS send failed for ${phone}: ${err.message}`);
  }
}

/**
 * Send a 6-digit OTP to a patient's phone.
 * @param {string} phone - +91XXXXXXXXXX
 * @param {string} otp   - 6-digit code (as string)
 */
const sendOTP = (phone, otp) =>
  sendSMS(phone, `Your LabIntel OTP is ${otp}. Valid for 5 minutes. Do not share this code.`);

/**
 * Notify a patient that their lab report is ready.
 * @param {string} phone   - +91XXXXXXXXXX
 * @param {string} name    - Patient's first name
 * @param {string} lab     - Lab name
 * @param {string} pdfUrl  - Signed PDF URL (or portal URL)
 */
const sendReportReady = (phone, name, lab, pdfUrl) =>
  sendSMS(
    phone,
    `Dear ${name}, your ${lab} lab report is ready. Download it here: ${pdfUrl}. - LabIntel`
  );

module.exports = { sendSMS, sendOTP, sendReportReady };
