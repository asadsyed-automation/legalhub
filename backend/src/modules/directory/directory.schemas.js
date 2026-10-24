const { z } = require('zod');
const {
  LANGUAGES,
  ALLOWED_SERVICE_MODES,
  DIRECTORY_SORT_OPTIONS,
  DEFAULT_DIRECTORY_SORT
} = require('../../constants/profile');
const { COURT_LEVELS, CITIES, PRACTICE_AREAS } = require('../../constants');

const directoryQuerySchema = z.object({
  city: z.string().trim().optional(),
  practiceArea: z.string().trim().optional(),
  language: z.enum(LANGUAGES).optional(),
  mode: z.enum(ALLOWED_SERVICE_MODES).optional(),
  minFee: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, {
      message: 'minFee must be a non-negative number'
    })
    .optional(),
  maxFee: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, {
      message: 'maxFee must be a non-negative number'
    })
    .optional(),
  courtLevel: z.enum(COURT_LEVELS).optional(),
  sort: z.enum(DIRECTORY_SORT_OPTIONS).default(DEFAULT_DIRECTORY_SORT),
  page: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: 'page must be an integer >= 1'
    })
    .default(1),
  limit: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: 'limit must be between 1 and 50'
    })
    .default(20)
});

module.exports = {
  directoryQuerySchema
};
