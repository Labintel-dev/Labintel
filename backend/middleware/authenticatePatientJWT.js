'use strict';
/**
 * authenticatePatientJWT — verifies custom JWTs signed with JWT_SECRET.
 * Used exclusively by patient portal routes.
 * Attaches payload to req.user: { patient_id, phone, role: 'patient' }
 */
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');

async function authenticatePatientJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Attempt 1: Try custom JWT (signed with JWT_SECRET)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role === 'patient') {
        req.user = payload;
        return next();
      }
    } catch (err) {
      // Not a valid custom JWT, proceed to Supabase check
    }

    // Attempt 2: Try Supabase Token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const phone = user.user_metadata?.phone || '';
    const email = user.email || '';

    // The auth.users.id is NOT the same as the public.patients.id where reports are linked.
    // We must find the correct patient ID using the phone number (or email) attached to the auth profile.
    let patientQuery = supabase.from('patients').select('id, phone, email');
    
    if (phone) {
      patientQuery = patientQuery.eq('phone', phone);
    } else if (email) {
      patientQuery = patientQuery.eq('email', email);
    }

    const { data: patient } = await patientQuery.single();

    req.user = {
      patient_id: patient ? patient.id : user.id,
      email: email,
      phone: patient ? patient.phone : phone,
      role: 'patient'
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = authenticatePatientJWT;
