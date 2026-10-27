const { z } = require('zod');
const { DOCUMENT_TYPES, DOCUMENT_VISIBILITIES, DOCUMENT_LIMITS } = require('../../constants/case');

/**
 * Preprocessor to handle tags arriving as JSON array strings or comma-separated strings
 * from multipart/form-data.
 */
const parseTags = (val) => {
  if (val === undefined || val === null || val === '') return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return val.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }
  return val;
};

const tagsSchema = z.preprocess(
  parseTags,
  z.array(
    z.string({ invalid_type_error: 'Tag must be a string' })
      .trim()
      .min(1, 'Tag cannot be empty')
      .max(DOCUMENT_LIMITS.MAX_TAG_LENGTH, `Tag cannot exceed ${DOCUMENT_LIMITS.MAX_TAG_LENGTH} characters`)
  ).max(DOCUMENT_LIMITS.MAX_TAGS, `Cannot attach more than ${DOCUMENT_LIMITS.MAX_TAGS} tags`)
).default([]);

const uploadDocumentSchema = z.object({
  docType: z.enum(DOCUMENT_TYPES, {
    errorMap: () => ({ message: `docType must be one of: ${DOCUMENT_TYPES.join(', ')}` })
  }),
  visibility: z.enum(DOCUMENT_VISIBILITIES, {
    errorMap: () => ({ message: `visibility must be one of: ${DOCUMENT_VISIBILITIES.join(', ')}` })
  }).default('private'),
  tags: tagsSchema
});

const updateDocumentSchema = z.object({
  docType: z.enum(DOCUMENT_TYPES, {
    errorMap: () => ({ message: `docType must be one of: ${DOCUMENT_TYPES.join(', ')}` })
  }).optional(),
  visibility: z.enum(DOCUMENT_VISIBILITIES, {
    errorMap: () => ({ message: `visibility must be one of: ${DOCUMENT_VISIBILITIES.join(', ')}` })
  }).optional(),
  tags: tagsSchema.optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

const queryDocumentSchema = z.object({
  docType: z.enum(DOCUMENT_TYPES).optional(),
  visibility: z.enum(DOCUMENT_VISIBILITIES).optional(),
  tag: z.string().trim().optional()
});

module.exports = {
  uploadDocumentSchema,
  updateDocumentSchema,
  queryDocumentSchema
};
