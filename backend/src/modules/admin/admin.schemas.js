const { z } = require('zod');
const { APPLICATION_STATUS } = require('../../constants');
const { ROLES } = require('../../constants/roles');

const rejectApplicationSchema = z.object({
  rejectionReason: z
    .string({ required_error: 'Rejection reason is required' })
    .trim()
    .min(10, { message: 'Rejection reason must be at least 10 characters long' })
    .max(500, { message: 'Rejection reason cannot exceed 500 characters' })
});

const listApplicationsQuerySchema = z.object({
  status: z
    .enum(
      [
        APPLICATION_STATUS.PENDING,
        APPLICATION_STATUS.APPROVED,
        APPLICATION_STATUS.REJECTED
      ],
      {
        errorMap: () => ({
          message: `Status filter must be one of: 'pending', 'approved', 'rejected'`
        })
      }
    )
    .optional()
});

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  role: z.enum([ROLES.CLIENT, ROLES.LAWYER, ROLES.LAW_FIRM, ROLES.ADMIN]).optional(),
  status: z.enum(['active', 'suspended', 'all']).default('all'),
  search: z.string().trim().max(100).optional()
});

const updateUserStatusSchema = z
  .object({
    status: z.enum(['active', 'suspended'], {
      required_error: "Status must be either 'active' or 'suspended'"
    }),
    reason: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (data.status === 'suspended' && (!data.reason || data.reason.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Suspension reason is required and must be at least 5 characters long'
      });
    }
  });

module.exports = {
  rejectApplicationSchema,
  listApplicationsQuerySchema,
  listUsersQuerySchema,
  updateUserStatusSchema
};

