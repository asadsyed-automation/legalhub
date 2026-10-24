const { z } = require('zod');
const { PRACTICE_AREAS } = require('../../constants');
const { ENGAGEMENT_STATUS, ALLOWED_ENGAGEMENT_STATUSES } = require('../../constants/engagement');

const createEngagementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  practiceArea: z.enum(PRACTICE_AREAS, {
    errorMap: () => ({
      message: `Practice area must be one of: ${PRACTICE_AREAS.join(', ')}`
    })
  }),
  notes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional().nullable(),
  bookingId: z.string().uuid('Invalid bookingId format').optional().nullable(),
  clientId: z.string().uuid('Invalid clientId format').optional().nullable(),
  lawyerId: z.string().uuid('Invalid lawyerId format').optional().nullable()
});

const updateEngagementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters')
    .optional(),
  status: z
    .enum(ALLOWED_ENGAGEMENT_STATUSES, {
      errorMap: () => ({
        message: `Status must be one of: ${ALLOWED_ENGAGEMENT_STATUSES.join(', ')}`
      })
    })
    .optional(),
  notes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional().nullable()
});

const listEngagementsQuerySchema = z.object({
  status: z.enum(ALLOWED_ENGAGEMENT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

module.exports = {
  createEngagementSchema,
  updateEngagementSchema,
  listEngagementsQuerySchema
};
