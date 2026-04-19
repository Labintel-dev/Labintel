'use strict';
const router          = require('express').Router();
const ctrl            = require('../controllers/analyticsController');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole       = require('../middleware/checkRole');

// All analytics routes: staff JWT + manager only
router.use(authenticateJWT, checkRole('manager'));

router.get('/dashboard',          ctrl.getDashboard);
router.get('/manager-dashboard',  ctrl.getManagerDashboard);
router.get('/awaiting-release',   ctrl.getAwaitingRelease);
router.get('/volume',             ctrl.getVolume);
router.get('/panels',             ctrl.getPanels);
router.get('/turnaround',         ctrl.getTurnaround);

module.exports = router;

