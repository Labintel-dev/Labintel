'use strict';
const router         = require('express').Router();
const ctrl           = require('../controllers/authController');
const authenticateJWT = require('../middleware/authenticateJWT');
const validateBody   = require('../middleware/validateBody');
const { staffLoginSchema, sendOtpSchema, verifyOtpSchema } = require('../schemas/auth.schemas');

// Public routes
router.post('/staff/login',      validateBody(staffLoginSchema), ctrl.staffLogin);
router.get('/lab/:slug',         ctrl.getLabBySlug);
router.post('/patient/send-otp', validateBody(sendOtpSchema),   ctrl.sendOtpHandler);
router.post('/patient/verify-otp', validateBody(verifyOtpSchema), ctrl.verifyOtpHandler);
router.get('/patient/google', ctrl.googleRedirect);
router.post('/patient/google/verify', ctrl.verifyGooglePatient);

// Protected routes
router.post('/staff/logout', authenticateJWT, ctrl.staffLogout);
router.get('/me',            authenticateJWT, ctrl.getMe);

module.exports = router;
