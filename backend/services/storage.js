'use strict';
/**
 * storage.js — Supabase Storage helpers for PDF files.
 * Bucket name is configurable via PDF_STORAGE_BUCKET env var.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = require('../db/supabase');
const logger   = require('../logger');

const BUCKET     = process.env.PDF_STORAGE_BUCKET || 'pdfs';
const URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Upload a PDF buffer to Supabase Storage.
 * @param {string} fileName - Storage path e.g. "lab_id/report_id.pdf"
 * @param {Buffer} buffer   - PDF binary
 * @returns {Promise<string>} Signed URL valid for 7 days
 */
async function uploadPDF(fileName, buffer) {
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert:      true, // replace if a PDF was previously generated
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  return getSignedUrl(fileName);
}

/**
 * Get a fresh signed URL for an existing PDF.
 * @param {string} fileName - Storage path e.g. "lab_id/report_id.pdf"
 * @returns {Promise<string>} Signed URL valid for 7 days
 */
async function getSignedUrl(fileName) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileName, URL_EXPIRY);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message || 'no URL returned'}`);
  }

  logger.debug(`Signed URL created for ${fileName}`);
  return data.signedUrl;
}

/**
 * Delete a PDF from storage (used in cleanup).
 * @param {string} fileName
 */
async function deletePDF(fileName) {
  const { error } = await supabase.storage.from(BUCKET).remove([fileName]);
  if (error) {
    logger.warn(`Storage delete failed for ${fileName}: ${error.message}`);
  }
}

module.exports = { uploadPDF, getSignedUrl, deletePDF };
