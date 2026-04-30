'use strict';
const router          = require('express').Router();
const ctrl            = require('../controllers/attendanceController');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole       = require('../middleware/checkRole');

// ── Staff routes (receptionist + technician) ──────────────────────────────────
router.post(
  '/check-in',
  authenticateJWT,
  checkRole('receptionist', 'technician'),
  ctrl.checkIn
);

router.patch(
  '/check-out',
  authenticateJWT,
  checkRole('receptionist', 'technician'),
  ctrl.checkOut
);

router.get(
  '/my',
  authenticateJWT,
  checkRole('receptionist', 'technician'),
  ctrl.getMyAttendance
);

// ── Manager / Administrator routes ────────────────────────────────────────────
router.get(
  '/all',
  authenticateJWT,
  checkRole('manager', 'administrator'),
  ctrl.getAllAttendance
);

router.get(
  '/summary',
  authenticateJWT,
  checkRole('manager', 'administrator'),
  ctrl.getSummary
);

module.exports = router;
