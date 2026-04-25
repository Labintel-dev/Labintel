'use strict';
/**
 * checkRole — role-based access control middleware.
 * Must run AFTER authenticateJWT (requires req.user.role to be set).
 *
 * Usage: checkRole('administrator', 'technician')
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const requestedRoles = new Set(allowedRoles);

    // Backward compatibility: manager and administrator are equivalent admin tiers.
    if (requestedRoles.has('administrator')) requestedRoles.add('manager');
    if (requestedRoles.has('manager')) requestedRoles.add('administrator');

    if (!requestedRoles.has(req.user.role)) {
      return res.status(403).json({
        error: `Insufficient permissions. Required: ${Array.from(requestedRoles).join(' or ')}`,
      });
    }

    next();
  };
}

module.exports = checkRole;
