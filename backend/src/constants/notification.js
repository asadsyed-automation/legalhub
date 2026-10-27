const NOTIFICATION_TYPES = Object.freeze({
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  CASE_ASSIGNED: 'case_assigned',
  CASE_STATUS_CHANGED: 'case_status_changed',
  HEARING_SCHEDULED: 'hearing_scheduled',
  HEARING_REMINDER: 'hearing_reminder',
  DOCUMENT_UPLOADED: 'document_uploaded',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM: 'system'
});

const EMAIL_STATUSES = Object.freeze({
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'skipped'
});

const REMINDER_MILESTONES = Object.freeze({
  THREE_DAYS_PRIOR: '3_days_prior',
  NIGHT_BEFORE: 'night_before',
  MORNING_OF: 'morning_of'
});

module.exports = {
  NOTIFICATION_TYPES,
  EMAIL_STATUSES,
  REMINDER_MILESTONES
};
