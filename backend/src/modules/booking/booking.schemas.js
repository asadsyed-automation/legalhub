const { z } = require('zod');
const { ALLOWED_SERVICE_MODES } = require('../../constants/profile');
const { BOOKING_STATUS, ALLOWED_BOOKING_STATUSES } = require('../../constants/booking');
const { MIN_LEAD_MINUTES } = require('../../constants/availability');

/**
 * Validates initial consultation appointment request created by a client.
 * Accepts either `startsAt` (upgraded Part G) or `startUtc` (legacy Part F).
 */
const createBookingSchema = z
  .object({
    lawyerId: z
      .string({ required_error: 'lawyerId is required' })
      .uuid('lawyerId must be a valid UUID'),
    mode: z.enum(ALLOWED_SERVICE_MODES, {
      required_error: `mode is required and must be one of: ${ALLOWED_SERVICE_MODES.join(', ')}`
    }),
    startsAt: z
      .string()
      .datetime({ message: 'startsAt must be a valid ISO-8601 UTC timestamp string' })
      .optional(),
    startUtc: z
      .string()
      .datetime({ message: 'startUtc must be a valid ISO-8601 UTC timestamp string' })
      .optional(),
    issueSummary: z
      .string()
      .min(10, 'issueSummary must be at least 10 characters')
      .max(1000, 'issueSummary cannot exceed 1000 characters')
      .optional()
      .nullable(),
    clientNotes: z
      .string()
      .max(1000, 'clientNotes cannot exceed 1000 characters')
      .optional()
      .nullable(),
    enquiryId: z
      .string()
      .uuid('enquiryId must be a valid UUID')
      .optional()
      .nullable()
  })
  .superRefine((data, ctx) => {
    const rawTime = data.startsAt || data.startUtc;
    if (!rawTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startsAt or startUtc is required',
        path: ['startsAt']
      });
      return;
    }

    const startMs = new Date(rawTime).getTime();
    const nowMs = Date.now();
    const minLeadMs = MIN_LEAD_MINUTES * 60 * 1000;

    if (startMs < nowMs + minLeadMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Appointment must be booked at least ${MIN_LEAD_MINUTES} minutes (2 hours) in advance`,
        path: [data.startsAt ? 'startsAt' : 'startUtc']
      });
    }
  });

/**
 * Validates advocate accepting a requested appointment (Part G).
 */
const acceptBookingSchema = z.object({
  lawyerNotes: z
    .string()
    .max(1000, 'lawyerNotes cannot exceed 1000 characters')
    .optional()
    .nullable()
});

/**
 * Validates advocate declining a requested appointment (Part G).
 */
const declineBookingSchema = z.object({
  reason: z
    .string({ required_error: 'Decline reason is required' })
    .min(10, 'Decline reason must be at least 10 characters')
    .max(1000, 'Decline reason cannot exceed 1000 characters')
});

/**
 * Validates simulated sandbox checkout payment by client (Part G).
 */
const payBookingSchema = z.object({
  method: z.string().optional().default('sandbox')
});

/**
 * Validates advocate confirming a paid booking with meeting credentials or chamber location (Part G).
 */
const confirmBookingSchema = z.object({
  sessionInfo: z
    .string()
    .max(300, 'sessionInfo cannot exceed 300 characters')
    .optional()
    .nullable(),
  lawyerNotes: z
    .string()
    .max(1000, 'lawyerNotes cannot exceed 1000 characters')
    .optional()
    .nullable()
});

/**
 * Validates lawyer response to an incoming booking (legacy confirm or reject).
 */
const respondBookingSchema = z
  .object({
    status: z.enum([BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.REJECTED], {
      required_error: 'status must be either confirmed or rejected'
    }),
    reason: z
      .string()
      .max(255, 'reason cannot exceed 255 characters')
      .optional()
      .nullable(),
    lawyerNotes: z
      .string()
      .max(1000, 'lawyerNotes cannot exceed 1000 characters')
      .optional()
      .nullable()
  })
  .superRefine((data, ctx) => {
    if (data.status === BOOKING_STATUS.REJECTED) {
      if (!data.reason || data.reason.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'reason is required with at least 5 characters when rejecting a booking',
          path: ['reason']
        });
      }
    }
  });

/**
 * Validates cancellation of an appointment by client or lawyer.
 */
const cancelBookingSchema = z.object({
  reason: z
    .string({ required_error: 'cancellation reason is required' })
    .min(5, 'cancellation reason must be at least 5 characters')
    .max(1000, 'cancellation reason cannot exceed 1000 characters')
});

/**
 * Validates marking an appointment as completed by lawyer.
 */
const completeBookingSchema = z.object({
  lawyerNotes: z
    .string()
    .max(2000, 'lawyerNotes cannot exceed 2000 characters')
    .optional()
    .nullable()
});

/**
 * Validates admin refund action for a booking.
 */
const refundBookingSchema = z.object({
  reason: z
    .string({ required_error: 'Refund reason is required' })
    .min(10, 'Refund reason must be at least 10 characters')
    .max(1000, 'Refund reason cannot exceed 1000 characters')
});

/**
 * Validates query parameters for listing bookings.
 */
const listBookingsQuerySchema = z.object({
  status: z.enum(ALLOWED_BOOKING_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

module.exports = {
  createBookingSchema,
  acceptBookingSchema,
  declineBookingSchema,
  payBookingSchema,
  confirmBookingSchema,
  respondBookingSchema,
  cancelBookingSchema,
  completeBookingSchema,
  refundBookingSchema,
  listBookingsQuerySchema
};
