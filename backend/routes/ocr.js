'use strict';

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/ocrController');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole = require('../middleware/checkRole');
const validateBody = require('../middleware/validateBody');
const { analyzeReportSchema } = require('../schemas/report.schemas');

const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OCR requests. Please try again in 15 minutes.' },
});

router.post(
  '/analyze-report',
  authenticateJWT,
  checkRole('administrator', 'manager', 'technician', 'receptionist'),
  ocrLimiter,
  validateBody(analyzeReportSchema),
  ctrl.analyzeReport
);

module.exports = router;
