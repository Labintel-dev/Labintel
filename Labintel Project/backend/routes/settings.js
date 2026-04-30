'use strict';
const router          = require('express').Router();
const ctrl            = require('../controllers/settingsController');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole       = require('../middleware/checkRole');
const validateBody    = require('../middleware/validateBody');
const {
  updateLabSchema, createPanelSchema, updatePanelSchema,
  inviteStaffSchema, updateStaffSchema,
} = require('../schemas/report.schemas');

// All settings routes require staff JWT
router.use(authenticateJWT);

// Lab profile — read for all, write for admin only
router.get('/lab',                                    ctrl.getLab);
router.put('/lab',  checkRole('administrator'),
                    validateBody(updateLabSchema),     ctrl.updateLab);

// Test panels — read for all, mutations admin only
router.get('/panels',      ctrl.listPanels);
router.post('/panels',     checkRole('administrator'),
                           validateBody(createPanelSchema),   ctrl.createPanel);
router.put('/panels/:id',  checkRole('administrator'),
                           validateBody(updatePanelSchema),   ctrl.updatePanel);
router.delete('/panels/:id', checkRole('administrator'),      ctrl.softDeletePanel);

// Staff management — admin only
router.get('/staff',              checkRole('administrator'),                                       ctrl.listStaff);
router.post('/staff/invite',      checkRole('administrator'), validateBody(inviteStaffSchema),      ctrl.inviteStaff);
router.put('/staff/:id',          checkRole('administrator'), validateBody(updateStaffSchema),      ctrl.updateStaff);

module.exports = router;
