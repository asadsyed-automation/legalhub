const AppError = require('../utils/AppError');

/**
 * Authorization middleware that ensures the authenticated user has one of the required roles.
 *
 * @param {...string} allowedRoles - List of permitted roles (e.g., 'admin', 'lawyer')
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const flatRoles = allowedRoles.flat();

  if (!flatRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  next();
};

module.exports = requireRole;
