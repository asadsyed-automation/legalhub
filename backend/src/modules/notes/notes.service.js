const { Booking, ConsultationNote } = require('../../models');
const AppError = require('../../utils/AppError');
const { BOOKING_STATUS } = require('../../constants/booking');

const ALLOWED_NOTE_BOOKING_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.COMPLETED
];

/**
 * Validates booking ownership and status for consultation notes access.
 *
 * @param {string} bookingId
 * @param {object} user
 * @returns {Promise<Booking>}
 */
const validateBookingForNotes = async (bookingId, user) => {
  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Only the assigned legal practitioner can access consultation notes
  if (booking.lawyerId !== user.id) {
    throw new AppError(
      'Forbidden: Only the assigned legal practitioner can view or record consultation notes',
      403
    );
  }

  // Booking must be confirmed or completed
  if (!ALLOWED_NOTE_BOOKING_STATUSES.includes(booking.status)) {
    throw new AppError(
      `Consultation notes can only be recorded for confirmed or completed appointments. Current status is '${booking.status}'`,
      400
    );
  }

  return booking;
};

/**
 * Retrieves the consultation note for a specific booking.
 *
 * @param {string} bookingId
 * @param {object} user
 * @returns {Promise<ConsultationNote|null>}
 */
const getNotes = async (bookingId, user) => {
  await validateBookingForNotes(bookingId, user);

  const note = await ConsultationNote.findOne({
    where: { bookingId }
  });

  return note;
};

/**
 * Creates or updates consultation notes for a booking.
 *
 * @param {string} bookingId
 * @param {object} user
 * @param {object} data
 * @returns {Promise<ConsultationNote>}
 */
const upsertNotes = async (bookingId, user, { summary, actionItems, privateNotes }) => {
  await validateBookingForNotes(bookingId, user);

  let note = await ConsultationNote.findOne({
    where: { bookingId }
  });

  if (note) {
    if (summary !== undefined) note.summary = summary;
    if (actionItems !== undefined) note.actionItems = actionItems;
    if (privateNotes !== undefined) note.privateNotes = privateNotes;
    await note.save();
  } else {
    note = await ConsultationNote.create({
      bookingId,
      lawyerId: user.id,
      summary: summary || null,
      actionItems: Array.isArray(actionItems) ? actionItems : [],
      privateNotes: privateNotes || null
    });
  }

  return note;
};

module.exports = {
  getNotes,
  upsertNotes,
  ALLOWED_NOTE_BOOKING_STATUSES
};
