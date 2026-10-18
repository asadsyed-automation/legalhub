const { z } = require('zod');
const { APPLICATION_STATUS } = require('../../constants');

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

module.exports = {
  rejectApplicationSchema,
  listApplicationsQuerySchema
};
