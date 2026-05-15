'use strict';
const router          = require('express').Router();
const ctrl            = require('../controllers/patientController');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole       = require('../middleware/checkRole');
const validateBody    = require('../middleware/validateBody');
const { createPatientSchema, updatePatientSchema } = require('../schemas/patient.schemas');

// All routes require staff JWT
router.use(authenticateJWT);

router.get('/',                                                       ctrl.listPatients);
router.post('/',   checkRole('administrator', 'receptionist'),
                   validateBody(createPatientSchema),                 ctrl.createPatient);

router.get('/:id',                                                    ctrl.getPatient);
router.put('/:id', checkRole('administrator', 'receptionist'),
                   validateBody(updatePatientSchema),                 ctrl.updatePatient);

router.get('/:id/reports',                                            ctrl.getPatientReports);
router.get('/:id/trends',                                             ctrl.getPatientTrends);
router.get('/:id/alerts',   checkRole('administrator'),               ctrl.getPatientAlerts);
router.put('/:id/alerts/:alertId', checkRole('administrator'),        ctrl.resolveAlert);

module.exports = router;
