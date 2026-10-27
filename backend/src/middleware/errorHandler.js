/**
 * Global Central Error Handling Middleware.
 * Standardizes all application errors to the format:
 * { "error": "message", "details": [ { "field": "fieldName", "message": "error explanation" } ] }
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = Array.isArray(err.details) ? err.details : [];

  // Sequelize Unique Constraint Violation -> 409 Conflict
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
    details = (err.errors || []).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Sequelize General Validation Error -> 400 Bad Request
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = (err.errors || []).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // JWT Errors -> 401 Unauthorized
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or malformed authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Multer File Upload Errors -> 400 Bad Request
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum permitted limit (10 MB)';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // In production, mask internal server error messages to prevent information leaks
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    error: message,
    details
  });
};

module.exports = errorHandler;
