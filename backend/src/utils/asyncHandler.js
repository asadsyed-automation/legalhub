/**
 * Wraps an asynchronous Express route/middleware handler to catch promise rejections
 * and automatically forward them to the global error-handling middleware.
 *
 * @param {Function} fn - Async express route handler (req, res, next)
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
