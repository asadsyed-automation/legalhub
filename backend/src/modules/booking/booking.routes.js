const { Router } = require('express');
const bookingController = require('./booking.controller');
const notesController = require('../notes/notes.controller');
const reviewController = require('../review/review.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireRole = require('../../middleware/requireRole');
const requireApprovedLawyer = require('../../middleware/requireApprovedLawyer');
const validate = require('../../middleware/validate');
const {
  createBookingSchema,
  acceptBookingSchema,
  declineBookingSchema,
  payBookingSchema,
  confirmBookingSchema,
  completeBookingSchema,
  cancelBookingSchema,
  listBookingsQuerySchema
} = require('./booking.schemas');
const { upsertNotesSchema } = require('../notes/notes.schemas');
const { createReviewSchema } = require('../review/review.schemas');
const { ROLES } = require('../../constants/roles');

const router = Router();

// Protect all booking routes with authentication
router.use(verifyToken);

// ==========================================
// Client Appointment Actions
// ==========================================
router.post(
  '/',
  requireRole(ROLES.CLIENT),
  validate(createBookingSchema),
  bookingController.createBooking
);

router.get(
  '/my-appointments',
  requireRole(ROLES.CLIENT),
  validate(listBookingsQuerySchema, 'query'),
  bookingController.getMyBookings
);

router.post(
  '/:id/pay',
  requireRole(ROLES.CLIENT),
  validate(payBookingSchema),
  bookingController.payBooking
);

router.post(
  '/:id/review',
  requireRole(ROLES.CLIENT),
  validate(createReviewSchema),
  reviewController.createReview
);

// ==========================================
// Advocate Appointment Actions (Part G & H)
// ==========================================
router.patch(
  '/:id/accept',
  requireApprovedLawyer,
  validate(acceptBookingSchema),
  bookingController.acceptBooking
);

router.patch(
  '/:id/decline',
  requireApprovedLawyer,
  validate(declineBookingSchema),
  bookingController.declineBooking
);

router.patch(
  '/:id/confirm',
  requireApprovedLawyer,
  validate(confirmBookingSchema),
  bookingController.confirmAppointment
);

router.patch(
  '/:id/complete',
  requireApprovedLawyer,
  validate(completeBookingSchema),
  bookingController.completeAppointment
);

router.get(
  '/:id/notes',
  requireApprovedLawyer,
  notesController.getNotes
);

router.put(
  '/:id/notes',
  requireApprovedLawyer,
  validate(upsertNotesSchema),
  notesController.upsertNotes
);

router.post(
  '/:id/review/reply',
  requireApprovedLawyer,
  reviewController.replyToReview
);

// ==========================================
// Shared Appointment Actions (Client / Lawyer)
// ==========================================
router.get('/:id', bookingController.getBookingById);

router.patch(
  '/:id/cancel',
  validate(cancelBookingSchema),
  bookingController.cancelBooking
);

module.exports = router;

