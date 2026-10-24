const { z } = require('zod');
const { PRACTICE_AREAS } = require('../../constants');
const { ALLOWED_ENQUIRY_STATUSES } = require('../../constants/enquiry');

/**
 * Validates initial pre-booking enquiry submitted by a prospective client.
 */
const createEnquirySchema = z.object({
  lawyerId: z
    .string({ required_error: 'lawyerId is required' })
    .uuid('lawyerId must be a valid UUID'),
  practiceArea: z.enum(PRACTICE_AREAS, {
    required_error: `practiceArea is required and must be one of: ${PRACTICE_AREAS.join(', ')}`
  }),
  subject: z
    .string({ required_error: 'subject is required' })
    .trim()
    .min(5, 'subject must be between 5 and 120 characters')
    .max(120, 'subject must be between 5 and 120 characters'),
  message: z
    .string({ required_error: 'message is required' })
    .trim()
    .min(10, 'message must be between 10 and 2000 characters')
    .max(2000, 'message must be between 10 and 2000 characters')
});

/**
 * Validates advocate reply to a prospective client enquiry.
 */
const replyEnquirySchema = z.object({
  reply: z
    .string({ required_error: 'reply is required' })
    .trim()
    .min(10, 'reply must be between 10 and 2000 characters')
    .max(2000, 'reply must be between 10 and 2000 characters')
});

/**
 * Validates query parameters for listing enquiries.
 */
const listEnquiriesQuerySchema = z.object({
  status: z.enum(ALLOWED_ENQUIRY_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

/**
 * Validates URL parameter for single enquiry lookup.
 */
const enquiryIdParamSchema = z.object({
  id: z.string().uuid('Invalid enquiry id')
});

module.exports = {
  createEnquirySchema,
  replyEnquirySchema,
  listEnquiriesQuerySchema,
  enquiryIdParamSchema
};
