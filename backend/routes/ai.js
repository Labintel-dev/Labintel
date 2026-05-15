'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/aiController');
const authenticateAnyUser = require('../middleware/authenticateAnyUser');

/**
 * @route POST /api/v1/ai/voice-summary
 * @desc Translate text to Hindi and generate TTS audio URLs
 * @access Private (authenticated users)
 */
router.post('/voice-summary', authenticateAnyUser, ctrl.getVoiceSummary);

/**
 * @route POST /api/v1/ai/voice-summary-public
 * @desc Public version for landing page/anonymous usage
 * @access Public
 */
router.post('/voice-summary-public', ctrl.getVoiceSummary);

module.exports = router;
