'use strict';
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');
const { supabaseAuth } = require('../db/supabase');
const logger = require('../logger');

/**
 * Middleware that allows either a valid Lab Staff OR a valid Patient.
 * Refactored to avoid "headers already sent" issues when one auth method fails.
 */
async function authenticateAnyUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Try Staff Auth (Supabase)
    const { data: { user: staffUser }, error: staffAuthError } = await supabaseAuth.auth.getUser(token);
    
    if (!staffAuthError && staffUser) {
      const { data: staff, error: staffDbError } = await supabase
        .from('lab_staff')
        .select('id, lab_id, role, full_name, is_active')
        .eq('supabase_uid', staffUser.id)
        .single();

      if (!staffDbError && staff && staff.is_active) {
        req.user = {
          id: staff.id,
          supabase_uid: staffUser.id,
          lab_id: staff.lab_id,
          role: staff.role,
          full_name: staff.full_name,
        };
        return next();
      }
    }

    // 2. Try Patient Auth (Custom JWT)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role === 'patient') {
        req.user = payload;
        return next();
      }
    } catch (err) {
      // Not a valid custom JWT, continue to Supabase patient check
    }

    // 3. Try Patient Auth (Supabase)
    const { data: { user: patientUser }, error: patientAuthError } = await supabase.auth.getUser(token);
    
    if (!patientAuthError && patientUser) {
      const phone = patientUser.user_metadata?.phone || '';
      const email = patientUser.email || '';

      let patientQuery = supabase.from('patients').select('id, phone, email');
      if (phone) {
        patientQuery = patientQuery.eq('phone', phone);
      } else if (email) {
        patientQuery = patientQuery.eq('email', email);
      }

      const { data: patient } = await patientQuery.single();

      req.user = {
        patient_id: patient ? patient.id : patientUser.id,
        email: email,
        phone: patient ? patient.phone : phone,
        role: 'patient'
      };
      return next();
    }

    // All auth attempts failed
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });

  } catch (err) {
    logger.error(`authenticateAnyUser error: ${err.message}`);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = authenticateAnyUser;
