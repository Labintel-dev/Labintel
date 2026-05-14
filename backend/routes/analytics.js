'use strict';
const router          = require('express').Router();
const ctrl            = require('../controllers/analyticsController');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole       = require('../middleware/checkRole');

// All analytics routes: staff JWT + administrator only
router.use(authenticateJWT, checkRole('administrator'));

router.get('/dashboard',   ctrl.getDashboard);
router.get('/volume',      ctrl.getVolume);
router.get('/panels',      ctrl.getPanels);
router.get('/turnaround',  ctrl.getTurnaround);

module.exports = router;
