const { z } = require('zod');
const { PRACTICE_AREAS } = require('../../constants');
const {
  CASE_STATUSES,
  CASE_STAGES,
  COURTS,
  CASE_LIMITS
} = require('../../constants/case');

const partyItemSchema = z.object({
  name: z
    .string({ required_error: 'Party name is required' })
    .trim()
    .min(1, 'Party name cannot be empty')
    .max(CASE_LIMITS.PARTY_NAME_MAX_LENGTH, `Party name cannot exceed ${CASE_LIMITS.PARTY_NAME_MAX_LENGTH} characters`),
  roleLabel: z
    .string({ required_error: 'Party role label is required' })
    .trim()
    .min(1, 'Role label cannot be empty')
    .max(CASE_LIMITS.ROLE_LABEL_MAX_LENGTH, `Role label cannot exceed ${CASE_LIMITS.ROLE_LABEL_MAX_LENGTH} characters`)
});

const createCaseSchema = z.object({
  title: z
    .string({ required_error: 'Case title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(CASE_LIMITS.TITLE_MAX_LENGTH, `Title cannot exceed ${CASE_LIMITS.TITLE_MAX_LENGTH} characters`),
  practiceArea: z.enum(PRACTICE_AREAS, {
    errorMap: () => ({ message: `Invalid practice area. Allowed: ${PRACTICE_AREAS.join(', ')}` })
  }),
  court: z.enum(COURTS, {
    errorMap: () => ({ message: 'Invalid court. Please select an approved judicial forum.' })
  }),
  caseOrFirNumber: z
    .string()
    .trim()
    .max(CASE_LIMITS.CASE_OR_FIR_MAX_LENGTH, `Case/FIR number cannot exceed ${CASE_LIMITS.CASE_OR_FIR_MAX_LENGTH} characters`)
    .optional()
    .nullable(),
  filingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Filing date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  status: z
    .enum(CASE_STATUSES, {
      errorMap: () => ({ message: `Invalid status. Allowed: ${CASE_STATUSES.join(', ')}` })
    })
    .default('Prospect'),
  stage: z
    .enum(CASE_STAGES, {
      errorMap: () => ({ message: `Invalid stage. Allowed: ${CASE_STAGES.join(', ')}` })
    })
    .optional()
    .nullable(),
  bookingId: z
    .string()
    .uuid('Invalid booking UUID format')
    .optional()
    .nullable(),
  parties: z
    .array(partyItemSchema)
    .max(CASE_LIMITS.MAX_PARTIES_PER_CASE, `Maximum ${CASE_LIMITS.MAX_PARTIES_PER_CASE} parties allowed per case`)
    .optional()
});

const updateCaseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(CASE_LIMITS.TITLE_MAX_LENGTH, `Title cannot exceed ${CASE_LIMITS.TITLE_MAX_LENGTH} characters`)
      .optional(),
    practiceArea: z
      .enum(PRACTICE_AREAS, {
        errorMap: () => ({ message: `Invalid practice area. Allowed: ${PRACTICE_AREAS.join(', ')}` })
      })
      .optional(),
    court: z
      .enum(COURTS, {
        errorMap: () => ({ message: 'Invalid court. Please select an approved judicial forum.' })
      })
      .optional(),
    caseOrFirNumber: z
      .string()
      .trim()
      .max(CASE_LIMITS.CASE_OR_FIR_MAX_LENGTH, `Case/FIR number cannot exceed ${CASE_LIMITS.CASE_OR_FIR_MAX_LENGTH} characters`)
      .optional()
      .nullable(),
    filingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Filing date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    status: z
      .enum(CASE_STATUSES, {
        errorMap: () => ({ message: `Invalid status. Allowed: ${CASE_STATUSES.join(', ')}` })
      })
      .optional(),
    stage: z
      .enum(CASE_STAGES, {
        errorMap: () => ({ message: `Invalid stage. Allowed: ${CASE_STAGES.join(', ')}` })
      })
      .optional()
      .nullable(),
    bookingId: z
      .string()
      .uuid('Invalid booking UUID format')
      .optional()
      .nullable(),
    parties: z
      .array(partyItemSchema)
      .max(CASE_LIMITS.MAX_PARTIES_PER_CASE, `Maximum ${CASE_LIMITS.MAX_PARTIES_PER_CASE} parties allowed per case`)
      .optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  });

const listCasesQuerySchema = z.object({
  status: z.enum(CASE_STATUSES).optional(),
  practiceArea: z.enum(PRACTICE_AREAS).optional(),
  court: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

module.exports = {
  createCaseSchema,
  updateCaseSchema,
  listCasesQuerySchema
};
