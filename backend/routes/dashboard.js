'use strict';
const router          = require('express').Router();
const ctrl            = require('../controllers/dashboardController');
const authenticateJWT = require('../middleware/authenticateJWT');

// Staff dashboard — any authenticated staff member can access their own dashboard
router.use(authenticateJWT);

router.get('/', ctrl.getStaffDashboard);

module.exports = router;
