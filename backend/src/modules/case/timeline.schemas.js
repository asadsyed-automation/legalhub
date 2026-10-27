const { z } = require('zod');

const timelineQuerySchema = z.object({
  page: z
    .preprocess((val) => (val ? parseInt(val, 10) : 1), z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((val) => (val ? parseInt(val, 10) : 20), z.number().int().min(1).max(50))
    .optional()
    .default(20),
  kind: z
    .enum(['entry', 'hearing', 'document', 'status_change'], {
      errorMap: () => ({
        message: 'kind must be one of: entry, hearing, document, status_change'
      })
    })
    .optional()
});

module.exports = {
  timelineQuerySchema
};
