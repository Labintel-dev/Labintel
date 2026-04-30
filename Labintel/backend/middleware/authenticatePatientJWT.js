'use strict';
/**
 * authenticatePatientJWT — verifies custom JWTs signed with JWT_SECRET.
 * Used exclusively by patient portal routes.
 * Attaches payload to req.user: { patient_id, phone, role: 'patient' }
 */
const jwt = require('jsonwebtoken');

function authenticatePatientJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient token' });
    }

    req.user = payload; // { patient_id, phone, role: 'patient', iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authenticatePatientJWT;
