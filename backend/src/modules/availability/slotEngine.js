const {
  TIMEZONE,
  TIMEZONE_OFFSET_HOURS,
  MIN_LEAD_MINUTES
} = require('../../constants/availability');

/**
 * Converts "HH:MM" 24-hr time string into total minutes since midnight.
 * e.g., "09:30" -> 570
 *
 * @param {string} timeStr
 * @returns {number}
 */
const timeStrToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts total minutes since midnight into "HH:MM" 24-hr time string.
 * e.g., 570 -> "09:30"
 *
 * @param {number} totalMinutes
 * @returns {string}
 */
const minutesToTimeStr = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Returns ISO-8601 weekday number (1=Mon, ..., 7=Sun) for a YYYY-MM-DD date string.
 *
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {number} 1 to 7
 */
const getIsoWeekday = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const jsDay = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 7 : jsDay;
};

/**
 * Pure Slot Generation Engine.
 *
 * Generates available consultation appointment slots across a date range
 * based on weekly rules, blocked dates, busy intervals, and minimum lead time.
 *
 * @param {object} options
 * @param {Array<object>} options.rules - Array of { weekday, startTime, endTime }
 * @param {Array<string>|Set<string>} options.blockedDates - Set or array of blocked "YYYY-MM-DD" strings
 * @param {Array<object>} [options.busyIntervals] - Array of { startUtc, endUtc }
 * @param {number} [options.slotMinutes] - Duration of each slot (default 30)
 * @param {string} options.fromDateStr - Start date "YYYY-MM-DD"
 * @param {string} options.toDateStr - End date "YYYY-MM-DD"
 * @param {Function} [options.now] - Injectable current time provider, returns Date
 * @returns {Array<object>} List of available slots
 */
const generateSlots = ({
  rules = [],
  blockedDates = [],
  busyIntervals = [],
  slotMinutes = 30,
  fromDateStr,
  toDateStr,
  now = () => new Date()
}) => {
  const blockedSet = blockedDates instanceof Set ? blockedDates : new Set(blockedDates);
  const slots = [];

  const currentTime = now();
  const leadBufferMs = MIN_LEAD_MINUTES * 60 * 1000;
  const earliestAllowedMs = currentTime.getTime() + leadBufferMs;

  // Prepare busy intervals for fast numerical comparison
  const parsedBusy = busyIntervals.map((interval) => ({
    startMs: new Date(interval.startUtc).getTime(),
    endMs: new Date(interval.endUtc).getTime()
  }));

  // Iterate calendar days from fromDateStr to toDateStr
  const currentCursor = new Date(`${fromDateStr}T00:00:00Z`);
  const endCursor = new Date(`${toDateStr}T00:00:00Z`);

  while (currentCursor <= endCursor) {
    const dateStr = currentCursor.toISOString().slice(0, 10);

    // If the entire day is explicitly blocked (e.g. Bar Council strike), skip
    if (!blockedSet.has(dateStr)) {
      const weekday = getIsoWeekday(dateStr);

      // Filter availability rules applicable to this weekday
      const dayRules = rules
        .filter((r) => r.weekday === weekday)
        .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));

      for (const rule of dayRules) {
        const startMin = timeStrToMinutes(rule.startTime);
        const endMin = timeStrToMinutes(rule.endTime);

        let cursorMin = startMin;
        while (cursorMin + slotMinutes <= endMin) {
          const slotStartLocal = minutesToTimeStr(cursorMin);
          const slotEndLocal = minutesToTimeStr(cursorMin + slotMinutes);

          // Convert Pakistan wall-clock time (+05:00) to standard UTC
          const startIsoPkt = `${dateStr}T${slotStartLocal}:00+05:00`;
          const endIsoPkt = `${dateStr}T${slotEndLocal}:00+05:00`;

          const slotStartDate = new Date(startIsoPkt);
          const slotEndDate = new Date(endIsoPkt);

          const slotStartMs = slotStartDate.getTime();
          const slotEndMs = slotEndDate.getTime();

          // 1. Minimum advance notice check: Must be at least MIN_LEAD_MINUTES ahead of now
          const satisfiesLeadTime = slotStartMs >= earliestAllowedMs;

          // 2. Conflict check: Must not overlap with any busy interval
          const hasConflict = parsedBusy.some((busy) => {
            return slotStartMs < busy.endMs && busy.startMs < slotEndMs;
          });

          if (satisfiesLeadTime && !hasConflict) {
            slots.push({
              date: dateStr,
              localDate: dateStr,
              startUtc: slotStartDate.toISOString(),
              startsAt: slotStartDate.toISOString(),
              endUtc: slotEndDate.toISOString(),
              endsAt: slotEndDate.toISOString(),
              startLocal: slotStartLocal,
              localTime: slotStartLocal,
              endLocal: slotEndLocal
            });
          }

          cursorMin += slotMinutes;
        }
      }
    }

    // Advance to next calendar day
    currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
  }

  return slots;
};

module.exports = {
  timeStrToMinutes,
  minutesToTimeStr,
  getIsoWeekday,
  generateSlots
};
