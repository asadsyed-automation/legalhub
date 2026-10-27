const { z } = require('zod');
const {
  FEE_AGREEMENT_TYPES,
  FEE_PAYMENT_METHODS,
  FEE_LIMITS
} = require('../../constants/case');

const upsertFeeAgreementSchema = z.object({
  type: z.enum(FEE_AGREEMENT_TYPES, {
    errorMap: () => ({
      message: `Agreement type must be one of: ${FEE_AGREEMENT_TYPES.join(', ')}`
    })
  }),
  agreedAmountPkr: z
    .number({ required_error: 'agreedAmountPkr is required' })
    .int('agreedAmountPkr must be an integer')
    .min(
      FEE_LIMITS.MIN_AGREED_AMOUNT_PKR,
      `agreedAmountPkr cannot be less than ${FEE_LIMITS.MIN_AGREED_AMOUNT_PKR}`
    )
    .max(
      FEE_LIMITS.MAX_FEE_PKR,
      `agreedAmountPkr cannot exceed ${FEE_LIMITS.MAX_FEE_PKR}`
    ),
  notes: z
    .string()
    .trim()
    .max(
      FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH,
      `notes cannot exceed ${FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH} characters`
    )
    .optional()
    .nullable()
});

const createFeePaymentSchema = z.object({
  amountPkr: z
    .number({ required_error: 'amountPkr is required' })
    .int('amountPkr must be an integer')
    .min(
      FEE_LIMITS.MIN_PAYMENT_PKR,
      `amountPkr must be at least ${FEE_LIMITS.MIN_PAYMENT_PKR} PKR`
    )
    .max(
      FEE_LIMITS.MAX_FEE_PKR,
      `amountPkr cannot exceed ${FEE_LIMITS.MAX_FEE_PKR} PKR`
    ),
  method: z.enum(FEE_PAYMENT_METHODS, {
    errorMap: () => ({
      message: `method must be one of: ${FEE_PAYMENT_METHODS.join(', ')}`
    })
  }),
  reference: z
    .string()
    .trim()
    .max(
      FEE_LIMITS.MAX_PAYMENT_REF_LENGTH,
      `reference cannot exceed ${FEE_LIMITS.MAX_PAYMENT_REF_LENGTH} characters`
    )
    .optional()
    .nullable(),
  paidOn: z
    .string({ required_error: 'paidOn date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'paidOn must be a valid date in YYYY-MM-DD format'),
  note: z
    .string()
    .trim()
    .max(
      FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH,
      `note cannot exceed ${FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH} characters`
    )
    .optional()
    .nullable()
});

module.exports = {
  upsertFeeAgreementSchema,
  createFeePaymentSchema
};
