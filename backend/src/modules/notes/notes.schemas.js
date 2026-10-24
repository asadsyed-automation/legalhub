const { z } = require('zod');

const upsertNotesSchema = z.object({
  summary: z.string().max(2000, 'Summary cannot exceed 2000 characters').optional().nullable(),
  actionItems: z
    .array(z.string().trim().min(1, 'Action item cannot be empty').max(300, 'Action item cannot exceed 300 characters'))
    .max(20, 'Maximum 20 action items allowed')
    .optional(),
  privateNotes: z.string().max(5000, 'Private notes cannot exceed 5000 characters').optional().nullable()
});

module.exports = {
  upsertNotesSchema
};
