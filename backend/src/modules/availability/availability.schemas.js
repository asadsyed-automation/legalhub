const { z } = require('zod');
const {
  TIMEZONE,
  WEEKDAY_MIN,
  WEEKDAY_MAX,
  MAX_WINDOWS_PER_DAY,
  MAX_SLOT_DAYS_LOOKAHEAD
} = require('../../constants/availability');

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Helper to obtain today's calendar date string (YYYY-MM-DD) in Asia/Karachi.
 *
 * @param {Date} [now]
 * @returns {string}
 */
const getTodayKarachiDateStr = (now = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
};

/**
 * Validates a single availability time window rule.
 */
const availabilityRuleItemSchema = z
  .object({
    weekday: z
      .number({ required_error: 'weekday is required' })
      .int()
      .min(WEEKDAY_MIN, `weekday must be between ${WEEKDAY_MIN} (Monday) and ${WEEKDAY_MAX} (Sunday)`)
      .max(WEEKDAY_MAX, `weekday must be between ${WEEKDAY_MIN} (Monday) and ${WEEKDAY_MAX} (Sunday)`),
    startTime: z
      .string({ required_error: 'startTime is required' })
      .regex(TIME_REGEX, 'startTime must be formatted as 24-hour time HH:MM (00:00 to 23:59)'),
    endTime: z
      .string({ required_error: 'endTime is required' })
      .regex(TIME_REGEX, 'endTime must be formatted as 24-hour time HH:MM (00:00 to 23:59)')
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'endTime must be strictly after startTime',
    path: ['endTime']
  });

/**
 * Validates full replacement of weekly availability rules.
 */
const setAvailabilityRulesSchema = z
  .object({
    rules: z.array(availabilityRuleItemSchema, {
      required_error: 'rules array is required'
    })
  })
  .superRefine((data, ctx) => {
    // Group rules by weekday
    const byWeekday = new Map();

    for (let i = 0; i < data.rules.length; i++) {
      const rule = data.rules[i];
      if (!byWeekday.has(rule.weekday)) {
        byWeekday.set(rule.weekday, []);
      }
      byWeekday.get(rule.weekday).push({ ...rule, index: i });
    }

    // Check count and overlap per weekday
    for (const [weekday, windows] of byWeekday.entries()) {
      if (windows.length > MAX_WINDOWS_PER_DAY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Weekday ${weekday} exceeds maximum of ${MAX_WINDOWS_PER_DAY} availability windows`,
          path: ['rules']
        });
      }

      // Check for overlapping intervals between windows on same weekday
      for (let j = 0; j < windows.length; j++) {
        for (let k = j + 1; k < windows.length; k++) {
          const w1 = windows[j];
          const w2 = windows[k];

          const overlaps = w1.startTime < w2.endTime && w2.startTime < w1.endTime;
          if (overlaps) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Overlapping availability windows on weekday ${weekday} (${w1.startTime}-${w1.endTime} and ${w2.startTime}-${w2.endTime})`,
              path: ['rules', w2.index]
            });
          }
        }
      }
    }
  });

/**
 * Validates adding a blocked date.
 */
const createBlockedDateSchema = z
  .object({
    date: z
      .string({ required_error: 'date is required' })
      .regex(DATE_REGEX, 'date must be in ISO format YYYY-MM-DD'),
    reason: z
      .string()
      .max(255, 'reason cannot exceed 255 characters')
      .optional()
      .nullable()
  })
  .superRefine((data, ctx) => {
    // Verify valid calendar date
    const parsed = new Date(`${data.date}T00:00:00Z`);
    if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'date must be a valid calendar date',
        path: ['date']
      });
      return;
    }

    const todayStr = getTodayKarachiDateStr();
    if (data.date < todayStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot block a date in the past',
        path: ['date']
      });
    }
  });

/**
 * Validates public slot generation query params.
 */
const slotsQuerySchema = z
  .object({
    from: z
      .string({ required_error: 'from query parameter is required' })
      .regex(DATE_REGEX, 'from date must be in ISO format YYYY-MM-DD'),
    to: z
      .string({ required_error: 'to query parameter is required' })
      .regex(DATE_REGEX, 'to date must be in ISO format YYYY-MM-DD')
  })
  .superRefine((data, ctx) => {
    const fromParsed = new Date(`${data.from}T00:00:00Z`);
    const toParsed = new Date(`${data.to}T00:00:00Z`);

    if (isNaN(fromParsed.getTime()) || fromParsed.toISOString().slice(0, 10) !== data.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from must be a valid calendar date (YYYY-MM-DD)',
        path: ['from']
      });
      return;
    }

    if (isNaN(toParsed.getTime()) || toParsed.toISOString().slice(0, 10) !== data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'to must be a valid calendar date (YYYY-MM-DD)',
        path: ['to']
      });
      return;
    }

    const todayStr = getTodayKarachiDateStr();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getTodayKarachiDateStr(yesterday);
    if (data.from < yesterdayStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'from date cannot be in the past',
        path: ['from']
      });
    }

    if (data.to < data.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'to date cannot be earlier than from date',
        path: ['to']
      });
      return;
    }

    // Check difference in calendar days <= MAX_SLOT_DAYS_LOOKAHEAD (14 days)
    const diffDays = Math.round((toParsed.getTime() - fromParsed.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_SLOT_DAYS_LOOKAHEAD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date range cannot exceed ${MAX_SLOT_DAYS_LOOKAHEAD} days`,
        path: ['to']
      });
    }
  });

module.exports = {
  setAvailabilityRulesSchema,
  createBlockedDateSchema,
  slotsQuerySchema,
  getTodayKarachiDateStr
};
