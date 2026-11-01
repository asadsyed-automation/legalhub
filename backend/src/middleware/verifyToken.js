const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { User } = require('../models');

/**
 * Middleware to verify JWT Bearer token from the Authorization header.
 * Attaches the decoded user payload to req.user and verifies active account status.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required', 401));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('Authentication token is required', 401));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;

    // Check if user exists in database and if account is suspended
    if (decoded && decoded.id) {
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'isActive', 'suspensionReason']
      });

      if (user && user.isActive === false) {
        return next(
          new AppError(
            user.suspensionReason
              ? `Account is suspended: ${user.suspensionReason}. Access revoked.`
              : 'Account is suspended. Access revoked.',
            403,
            [{ field: 'account', message: 'ACCOUNT_SUSPENDED' }]
          )
        );
      }
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired', 401));
    }
    return next(new AppError('Invalid or malformed authentication token', 401));
  }
};

module.exports = verifyToken;
