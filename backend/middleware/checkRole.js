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

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

module.exports = checkRole;
