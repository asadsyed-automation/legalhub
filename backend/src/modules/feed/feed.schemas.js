const { z } = require('zod');
const { PRACTICE_AREAS } = require('../../constants');

const createQuestionSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(5, 'Title must be between 5 and 150 characters')
    .max(150, 'Title must be between 5 and 150 characters'),
  practiceArea: z.enum(PRACTICE_AREAS, {
    required_error: `practiceArea is required and must be one of: ${PRACTICE_AREAS.join(', ')}`
  }),
  city: z
    .string()
    .trim()
    .max(50, 'City cannot exceed 50 characters')
    .optional()
    .nullable(),
  content: z
    .string({ required_error: 'Question content is required' })
    .trim()
    .min(15, 'Question content must be between 15 and 3000 characters')
    .max(3000, 'Question content must be between 15 and 3000 characters')
});

const queryQuestionsSchema = z.object({
  practiceArea: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(['open', 'closed', 'all']).optional(),
  q: z.string().optional(),
  clientId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const createAnswerSchema = z.object({
  content: z
    .string({ required_error: 'Legal answer content is required' })
    .trim()
    .min(10, 'Legal answer must be between 10 and 5000 characters')
    .max(5000, 'Legal answer must be between 10 and 5000 characters')
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID parameter')
});

module.exports = {
  createQuestionSchema,
  queryQuestionsSchema,
  createAnswerSchema,
  idParamSchema
};

