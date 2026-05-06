'use strict';
const { analyzeReportImage } = require('../services/aiService');
const logger = require('../logger');

/**
 * POST /api/v1/ocr/analyze-report
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
    logger.info('OCR analysis started', {
      patientId: patientId || null,
      staffId: req.user?.id || null,
      labId: req.user?.lab_id || null,
      mimeType,
    });
    
    // Analyze the image
    const result = await analyzeReportImage(image, mimeType);

    logger.info('OCR analysis completed', {
      type: result.type,
      parametersFound: result.results?.parameters?.length || 0,
      staffId: req.user?.id || null,
    });

    // Return the structured result
    res.json(result);
  } catch (err) {
    logger.error(`OCR analysis failed: ${err.message}`, { stack: err.stack });
    
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
