const { z } = require('zod');

const createMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message content cannot exceed 2000 characters'),
  attachments: z
    .array(
      z.object({
        name: z.string().optional(),
        url: z.string().optional(),
        mimeType: z.string().optional(),
        sizeBytes: z.number().optional()
      })
    )
    .max(5, 'Cannot attach more than 5 files to a message')
    .optional()
});

const getMessagesQuerySchema = z.object({
  page: z
    .preprocess((val) => (val ? parseInt(val, 10) : 1), z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((val) => (val ? parseInt(val, 10) : 20), z.number().int().min(1).max(100))
    .optional()
    .default(20)
});

const targetIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Target ID must be a valid UUID' })
});

module.exports = {
  createMessageSchema,
  getMessagesQuerySchema,
  targetIdParamSchema
};
