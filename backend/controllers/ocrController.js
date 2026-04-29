'use strict';
const { analyzeReportImage } = require('../services/gemini');
const logger = require('../logger');

/**
 * POST /api/v1/ocr/analyze-report
 * Analyzes a medical report image using Gemini Vision
 * 
 * Request body:
 * {
 *   image: base64-encoded image string,
 *   mimeType: 'image/jpeg' (optional, defaults to image/jpeg),
 *   patientId: patient UUID (optional)
 * }
 */
async function analyzeReport(req, res) {
  const { image, mimeType = 'image/jpeg', patientId } = req.body;

  try {
    const startTime = Date.now();
    logger.info('OCR analysis started', {
      patientId: patientId || null,
      staffId: req.user?.id || null,
      labId: req.user?.lab_id || null,
      mimeType,
      imageSize: image?.length || 0,
    });
    
    // Analyze the image
    const result = await analyzeReportImage(image, mimeType);
    const processingTime = Date.now() - startTime;

    logger.info('OCR analysis completed', {
      type: result.type,
      parametersFound: result.results?.parameters?.length || 0,
      medicinesFound: result.results?.medicines?.length || 0,
      processingTimeMs: processingTime,
      staffId: req.user?.id || null,
    });

    // Return the structured result
    res.json(result);
  } catch (err) {
    logger.error(`OCR analysis failed: ${err.message}`, { 
      stack: err.stack,
      staffId: req.user?.id || null,
      labId: req.user?.lab_id || null,
    });
    
    // Return error but with a valid structure so frontend can display the error gracefully
    res.status(500).json({
      error: 'OCR analysis failed',
      details: err.message || 'Failed to analyze the medical report image. Please try with a clearer image.',
      type: 'Lab Report',
      summary: 'Analysis failed. Please upload a clearer image.',
      patientInfo: {},
      results: { parameters: [], medicines: [] },
      advice: [],
    });
  }
}

module.exports = { analyzeReport };
