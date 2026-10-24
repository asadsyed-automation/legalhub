const bookingService = require('./booking.service');

/**
 * POST /api/v1/bookings
 * Create a new consultation appointment booking (Citizen Client action).
 */
const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);
    return res.status(201).json({ booking });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/bookings/my-appointments
 * Fetch paginated consultation appointments for authenticated client.
 */
const getMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getClientBookings(req.user.id, req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/lawyer/appointments
 * Fetch incoming consultation appointments for authenticated advocate.
 */
const getLawyerAppointments = async (req, res, next) => {
  try {
    const result = await bookingService.getLawyerBookings(req.user.id, req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/bookings/:id
 * Fetch details of a single appointment.
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(
      req.user.id,
      req.user.role,
      req.params.id
    );
    return res.status(200).json({ booking });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/accept
 * Advocate accepts a requested consultation appointment (Part G).
 */
const acceptBooking = async (req, res, next) => {
  try {
    const result = await bookingService.acceptBooking(
      req.user.id,
      req.params.id,
      req.body ? req.body.lawyerNotes : null
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/decline
 * Advocate declines a requested consultation appointment (Part G).
 */
const declineBooking = async (req, res, next) => {
  try {
    const result = await bookingService.declineBooking(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/bookings/:id/pay
 * Client executes simulated sandbox payment for an accepted booking (Part G).
 */
const payBooking = async (req, res, next) => {
  try {
    const result = await bookingService.payBooking(
      req.user.id,
      req.params.id,
      req.body || {}
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/lawyer/appointments/:id/confirm or PATCH /api/v1/bookings/:id/confirm
 * Advocate confirms a paid consultation appointment with sessionInfo (Part G).
 */
const confirmAppointment = async (req, res, next) => {
  try {
    const sessionInfo = req.body ? req.body.sessionInfo : null;
    const lawyerNotes = req.body ? req.body.lawyerNotes : null;
    const result = await bookingService.confirmBooking(
      req.user.id,
      req.params.id,
      sessionInfo,
      lawyerNotes
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/lawyer/appointments/:id/reject
 * Advocate rejects a pending consultation appointment (Legacy Part F).
 */
const rejectAppointment = async (req, res, next) => {
  try {
    const result = await bookingService.rejectBooking(
      req.user.id,
      req.params.id,
      req.body.reason,
      req.body.lawyerNotes
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/cancel
 * Client or Advocate cancels an active appointment before start time.
 */
const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/lawyer/appointments/:id/complete or PATCH /api/v1/bookings/:id/complete
 * Advocate marks a confirmed consultation as completed.
 */
const completeAppointment = async (req, res, next) => {
  try {
    const result = await bookingService.completeBooking(
      req.user.id,
      req.params.id,
      req.body ? req.body.lawyerNotes : null
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/admin/bookings/:id/refund
 * Admin refunds a paid/confirmed/completed consultation appointment.
 */
const refundBooking = async (req, res, next) => {
  try {
    const result = await bookingService.refundBooking(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getLawyerAppointments,
  getBookingById,
  acceptBooking,
  declineBooking,
  payBooking,
  confirmAppointment,
  rejectAppointment,
  cancelBooking,
  completeAppointment,
  refundBooking
};
