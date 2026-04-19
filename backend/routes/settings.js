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

// Lab profile — read for all, write for admin/manager only
router.get('/lab',                                    ctrl.getLab);
router.put('/lab',  checkRole('manager'),
                    validateBody(updateLabSchema),     ctrl.updateLab);

// Test panels — read for all, mutations admin/manager only
router.get('/panels',      ctrl.listPanels);
router.post('/panels',     checkRole('manager'),
                           validateBody(createPanelSchema),   ctrl.createPanel);
router.put('/panels/:id',  checkRole('manager'),
                           validateBody(updatePanelSchema),   ctrl.updatePanel);
router.delete('/panels/:id', checkRole('manager'),      ctrl.softDeletePanel);

// Staff management — admin/manager only
router.get('/staff',              checkRole('manager'),                                       ctrl.listStaff);
router.post('/staff/invite',      checkRole('manager'), validateBody(inviteStaffSchema),      ctrl.inviteStaff);
router.put('/staff/:id',          checkRole('manager'), validateBody(updateStaffSchema),      ctrl.updateStaff);

module.exports = router;
