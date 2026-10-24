const { z } = require('zod');
const {
  PRACTICE_AREAS,
  CITIES,
  LANGUAGES,
  ALLOWED_SERVICE_MODES,
  URGENCY_LEVELS
} = require('../../constants');

/**
 * Validates text complaint submitted for practice-area classification.
 */
const classifySchema = z.object({
  text: z
    .string({ required_error: 'text is required' })
    .trim()
    .min(10, 'text must be at least 10 characters')
    .max(1000, 'text cannot exceed 1000 characters')
});

/**
 * Validates search criteria for objective multi-factor matching.
 */
const searchMatchSchema = z.object({
  practiceArea: z.enum(PRACTICE_AREAS, {
    required_error: `practiceArea is required and must be one of: ${PRACTICE_AREAS.join(', ')}`
  }),
  city: z.enum(CITIES).optional(),
  urgency: z.enum(Object.values(URGENCY_LEVELS)).optional(),
  maxFeePkr: z
    .number()
    .int()
    .min(0, 'maxFeePkr cannot be negative')
    .max(200000, 'maxFeePkr cannot exceed 200,000')
    .optional(),
  mode: z.enum(ALLOWED_SERVICE_MODES).optional(),
  language: z.enum(LANGUAGES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

module.exports = {
  classifySchema,
  searchMatchSchema
};
