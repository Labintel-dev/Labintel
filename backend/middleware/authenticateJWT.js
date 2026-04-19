'use strict';
/**
 * authenticateJWT — verifies Supabase session tokens sent by lab staff.
 * Attaches the staff record to req.user:
 *   { id, supabase_uid, lab_id, role, full_name }
 */
const supabase = require('../db/supabase');
const { supabaseAuth } = require('../db/supabase');
const logger   = require('../logger');

async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Validate with Supabase Auth using the isolated auth client
  // (avoids session bleed into the service-role DB client)
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Fetch staff record linked to this Supabase user
  const { data: staff, error: staffError } = await supabase
    .from('lab_staff')
    .select('id, lab_id, role, full_name, is_active')
    .eq('supabase_uid', user.id)
    .single();

  if (staffError || !staff) {
    logger.warn(`authenticateJWT: no staff record for supabase_uid ${user.id}`);
    return res.status(403).json({ error: 'Staff account not found' });
  }

  if (!staff.is_active) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }

  req.user = {
    id:          staff.id,
    supabase_uid: user.id,
    lab_id:      staff.lab_id,
    role:        staff.role,
    full_name:   staff.full_name,
  };

  next();
}

module.exports = authenticateJWT;
