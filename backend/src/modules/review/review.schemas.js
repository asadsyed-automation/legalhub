const { z } = require('zod');
const { REVIEW_CONSTANTS } = require('../../constants/engagement');

const createReviewSchema = z.object({
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(REVIEW_CONSTANTS.MIN_RATING, `Rating must be at least ${REVIEW_CONSTANTS.MIN_RATING}`)
    .max(REVIEW_CONSTANTS.MAX_RATING, `Rating cannot exceed ${REVIEW_CONSTANTS.MAX_RATING}`),
  comment: z
    .string({ required_error: 'Review comment is required' })
    .trim()
    .min(REVIEW_CONSTANTS.MIN_COMMENT_LENGTH, `Review comment must be at least ${REVIEW_CONSTANTS.MIN_COMMENT_LENGTH} characters`)
    .max(REVIEW_CONSTANTS.MAX_COMMENT_LENGTH, `Review comment cannot exceed ${REVIEW_CONSTANTS.MAX_COMMENT_LENGTH} characters`)
});

const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

module.exports = {
  createReviewSchema,
  listReviewsQuerySchema
};
