const { z } = require('zod');
const { CASE_ENTRY_TYPES, ENTRY_VISIBILITIES } = require('../../constants/case');

const createCaseEntrySchema = z.object({
  entryDate: z
    .string({ required_error: 'Entry date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Entry date must be in YYYY-MM-DD format'),
  entryType: z.enum(CASE_ENTRY_TYPES, {
    errorMap: () => ({ message: `Entry type must be one of: ${CASE_ENTRY_TYPES.join(', ')}` })
  }),
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  body: z
    .string({ required_error: 'Body is required' })
    .trim()
    .min(1, 'Body is required')
    .max(5000, 'Body cannot exceed 5000 characters'),
  visibility: z.enum(ENTRY_VISIBILITIES).default('private')
});

const updateCaseEntrySchema = z.object({
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Entry date must be in YYYY-MM-DD format')
    .optional(),
  entryType: z.enum(CASE_ENTRY_TYPES).optional(),
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title cannot exceed 150 characters')
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, 'Body cannot be empty')
    .max(5000, 'Body cannot exceed 5000 characters')
    .optional(),
  visibility: z.enum(ENTRY_VISIBILITIES).optional()
});

const queryCaseEntrySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  entryType: z.enum(CASE_ENTRY_TYPES).optional(),
  visibility: z.enum(ENTRY_VISIBILITIES).optional()
});

module.exports = {
  createCaseEntrySchema,
  updateCaseEntrySchema,
  queryCaseEntrySchema
};
