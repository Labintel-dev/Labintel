'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/adminController');

// NOTE: Admin routes are not protected by staff JWT — they use a separate
// admin session stored in localStorage by AdminLogin.jsx.
// Future: add admin-specific JWT middleware here.

// Stats
router.get('/stats',    ctrl.getStats);

// Labs CRUD
router.get('/labs',       ctrl.getLabs);
router.post('/labs',      ctrl.createLab);
router.put('/labs/:id',   ctrl.updateLab);
router.delete('/labs/:id', ctrl.deleteLab);

// Live sessions
router.get('/sessions',  ctrl.getSessions);

// Activity log
router.get('/activity',  ctrl.getActivity);

// Cross-lab reports
router.get('/reports',   ctrl.getReports);

// All staff / team
router.get('/team',      ctrl.getTeam);

module.exports = router;
