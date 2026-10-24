/**
 * Booking Lifecycle, Payment, & State Machine Constants
 */

const BOOKING_STATUS = Object.freeze({
  REQUESTED: 'requested',
  PENDING: 'pending', // Legacy alias for requested
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  REJECTED: 'rejected', // Legacy alias for declined
  PAID: 'paid',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  EXPIRED: 'expired'
});

/**
 * Open booking statuses that block calendar slots and count toward client open booking limit.
 */
const OPEN_BOOKING_STATUSES = Object.freeze([
  BOOKING_STATUS.REQUESTED,
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.PAID,
  BOOKING_STATUS.CONFIRMED
]);

const ACTIVE_BOOKING_STATUSES = OPEN_BOOKING_STATUSES;

const ALLOWED_BOOKING_STATUSES = Object.freeze(Object.values(BOOKING_STATUS));

/**
 * Finite State Machine allowed state transitions.
 * Any attempt to execute a transition not listed here results in a 409 Conflict.
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [BOOKING_STATUS.REQUESTED]: [
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.DECLINED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.EXPIRED
  ],
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.DECLINED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.EXPIRED
  ],
  [BOOKING_STATUS.ACCEPTED]: [
    BOOKING_STATUS.PAID,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.EXPIRED
  ],
  [BOOKING_STATUS.PAID]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.REFUNDED
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.REFUNDED
  ],
  [BOOKING_STATUS.COMPLETED]: [
    BOOKING_STATUS.REFUNDED // Admin only
  ]
});

const BOOKING_EXPIRY_WINDOWS = Object.freeze({
  REQUEST_HOURS: 24, // Request expires after 24h without lawyer action
  PAYMENT_HOURS: 12 // Accepted booking expires after 12h without payment
});

const MAX_OPEN_BOOKINGS_PER_CLIENT = 3;

const PAYMENT_METHOD = Object.freeze({
  SANDBOX: 'sandbox'
});

const PAYMENT_STATUS = Object.freeze({
  SUCCEEDED: 'succeeded',
  REFUNDED: 'refunded'
});

module.exports = {
  BOOKING_STATUS,
  OPEN_BOOKING_STATUSES,
  ACTIVE_BOOKING_STATUSES,
  ALLOWED_BOOKING_STATUSES,
  ALLOWED_TRANSITIONS,
  BOOKING_EXPIRY_WINDOWS,
  MAX_OPEN_BOOKINGS_PER_CLIENT,
  PAYMENT_METHOD,
  PAYMENT_STATUS
};
