'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/patientPortalController');
const authenticatePatientJWT = require('../middleware/authenticatePatientJWT');
const validateBody           = require('../middleware/validateBody');
const { updatePatientSchema } = require('../schemas/patient.schemas');

// All patient portal routes require patient JWT
router.use(authenticatePatientJWT);

router.get('/reports',         ctrl.getMyReports);
router.get('/reports/:id',     ctrl.getMyReport);
router.get('/trends',          ctrl.getMyTrends);
router.get('/profile',         ctrl.getMyProfile);
router.put('/profile',         validateBody(updatePatientSchema), ctrl.updateMyProfile);

module.exports = router;
