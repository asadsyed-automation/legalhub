/**
 * Enquiry Constants
 */

const ENQUIRY_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  ANSWERED: 'answered',
  CLOSED: 'closed'
});

const ALLOWED_ENQUIRY_STATUSES = Object.freeze(Object.values(ENQUIRY_STATUS));

const MAX_PENDING_ENQUIRIES_PER_PAIR = 3;

module.exports = {
  ENQUIRY_STATUS,
  ALLOWED_ENQUIRY_STATUSES,
  MAX_PENDING_ENQUIRIES_PER_PAIR
};
