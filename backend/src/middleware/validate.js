const AppError = require('../utils/AppError');

/**
 * Middleware factory to validate request data against a Zod schema.
 * Can accept:
 * 1. A single Zod object schema (validates req.body by default)
 * 2. An object with keys: { body, query, params }
 *
 * @param {import('zod').ZodSchema | { body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    if (schema.body || schema.query || schema.params) {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      return next();
    }

    if (schema && typeof schema.parse === 'function') {
      req[source] = schema.parse(req[source]);
      return next();
    }

    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const details = error.errors.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return next(new AppError('Validation failed', 400, details));
    }
    next(error);
  }
};

module.exports = validate;
