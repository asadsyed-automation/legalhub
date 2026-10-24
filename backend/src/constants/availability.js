/**
 * Availability & Slot Generation Constants
 * Configured specifically for Pakistan legal practice standards.
 */

const AVAILABILITY_CONSTANTS = {
  TIMEZONE: 'Asia/Karachi',
  TIMEZONE_OFFSET_HOURS: 5,
  MIN_LEAD_MINUTES: 120, // 2-hour advance booking lead time
  MAX_SLOT_DAYS_LOOKAHEAD: 14, // Maximum 14 days slot query window
  MAX_WINDOWS_PER_DAY: 3, // Up to 3 time windows per weekday
  WEEKDAY_MIN: 1, // Monday (ISO-8601)
  WEEKDAY_MAX: 7 // Sunday (ISO-8601)
};

module.exports = AVAILABILITY_CONSTANTS;
