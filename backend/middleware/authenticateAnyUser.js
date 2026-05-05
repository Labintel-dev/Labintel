'use strict';
const authenticateJWT = require('./authenticateJWT');
const authenticatePatientJWT = require('./authenticatePatientJWT');

/**
 * Middleware that allows either a valid Lab Staff OR a valid Patient.
 */
function authenticateAnyUser(req, res, next) {
  // Try Staff first
  authenticateJWT(req, res, (err) => {
    if (!err && req.user) {
      return next();
    }
    
    // Try Patient if Staff fails
    authenticatePatientJWT(req, res, (err2) => {
      if (!err2 && req.user) {
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized. Must be logged in as staff or patient.' });
    });
  });
}

module.exports = authenticateAnyUser;
