const AppError = require('../utils/AppError');

/**
 * Catches all requests to non-existent routes and forwards a 404 AppError.
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

module.exports = notFound;
