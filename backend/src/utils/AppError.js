class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500, etc.)
   * @param {Array<{field?: string, message: string}>} [details=[]] - Optional structured field-level error details
   */
  constructor(message, statusCode = 500, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = Array.isArray(details) ? details : [];

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
