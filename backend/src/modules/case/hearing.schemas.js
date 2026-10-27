const { z } = require('zod');
const { CASE_STAGES, ENTRY_VISIBILITIES } = require('../../constants/case');

const createHearingSchema = z.object({
  scheduledAt: z
    .string({ required_error: 'Scheduled hearing date/time is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Scheduled hearing date/time must be a valid ISO date-time string'
    }),
  court: z.string().trim().min(2).max(255).optional(),
  bench: z.string().trim().max(120).optional().nullable(),
  stage: z.enum(CASE_STAGES).optional().nullable(),
  outcome: z.string().trim().max(300).optional().nullable(),
  nextDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'nextDate must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  adjournmentReason: z.string().trim().max(300).optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
  clientExplanation: z.string().trim().max(1000).optional().nullable(),
  visibility: z.enum(ENTRY_VISIBILITIES).default('shared')
});

const updateHearingSchema = z.object({
  scheduledAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Scheduled hearing date/time must be a valid ISO date-time string'
    })
    .optional(),
  court: z.string().trim().min(2).max(255).optional(),
  bench: z.string().trim().max(120).optional().nullable(),
  stage: z.enum(CASE_STAGES).optional().nullable(),
  outcome: z.string().trim().max(300).optional().nullable(),
  nextDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'nextDate must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  adjournmentReason: z.string().trim().max(300).optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
  clientExplanation: z.string().trim().max(1000).optional().nullable(),
  visibility: z.enum(ENTRY_VISIBILITIES).optional()
});

const quickOutcomeHearingSchema = z.object({
  outcome: z
    .string({ required_error: 'Hearing outcome is required' })
    .trim()
    .min(1, 'Hearing outcome cannot be empty')
    .max(300, 'Hearing outcome cannot exceed 300 characters'),
  nextDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'nextDate must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  adjournmentReason: z.string().trim().max(300).optional().nullable()
});

const queryHearingSchema = z.object({
  from: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'from date must be valid' })
    .optional(),
  to: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'to date must be valid' })
    .optional(),
  court: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

module.exports = {
  createHearingSchema,
  updateHearingSchema,
  quickOutcomeHearingSchema,
  queryHearingSchema
};
