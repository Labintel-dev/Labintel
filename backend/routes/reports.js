'use strict';
const router          = require('express').Router();
const ctrl            = require('../controllers/reportController');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole       = require('../middleware/checkRole');
const validateBody    = require('../middleware/validateBody');
const { createReportSchema, updateStatusSchema } = require('../schemas/report.schemas');

// ── Public route (must be before authenticateJWT middleware) ────────────────
// Doctor read-only share link — no auth required
router.get('/share/:token', ctrl.shareReport);

// Public sample report for landing page demo
router.get('/sample', ctrl.getSampleReport);

// ── All other routes require staff JWT ─────────────────────────────────────
router.use(authenticateJWT);

router.get('/',    ctrl.listReports);
router.post('/',   checkRole('administrator', 'technician'),
                   validateBody(createReportSchema),          ctrl.createReport);

router.get('/:id',                                           ctrl.getReport);
router.patch('/:id/status',
             checkRole('administrator', 'technician', 'receptionist'),
             validateBody(updateStatusSchema),                ctrl.updateStatus);

router.post('/:id/insights',
            checkRole('administrator', 'technician'),         ctrl.regenerateInsights);
router.post('/:id/generate-pdf',
            checkRole('administrator', 'manager', 'technician', 'receptionist'),         ctrl.generatePdf);
router.get('/:id/download',                                  ctrl.downloadReport);

module.exports = router;
