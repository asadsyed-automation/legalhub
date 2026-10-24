const { Op } = require('sequelize');
const {
  sequelize,
  AvailabilityRule,
  BlockedDate,
  LawyerApplication,
  LawyerProfile,
  Booking
} = require('../../models');
const { APPLICATION_STATUS, BOOKING_STATUS } = require('../../constants');
const { TIMEZONE } = require('../../constants/availability');
const { generateSlots } = require('./slotEngine');
const { getTodayKarachiDateStr } = require('./availability.schemas');
const AppError = require('../../utils/AppError');

/**
 * Fetch all availability rules configured by the authenticated advocate.
 *
 * @param {string} userId - UUID of the advocate
 * @returns {Promise<Array<object>>}
 */
const getAvailabilityRules = async (userId) => {
  const rules = await AvailabilityRule.findAll({
    where: { lawyerId: userId },
    order: [
      ['weekday', 'ASC'],
      ['startTime', 'ASC']
    ],
    attributes: ['id', 'weekday', 'startTime', 'endTime']
  });

  return rules.map((r) => r.toJSON());
};

/**
 * Replace all availability rules for an advocate atomically within a transaction.
 *
 * @param {string} userId - UUID of the advocate
 * @param {Array<object>} rules - Array of { weekday, startTime, endTime }
 * @returns {Promise<Array<object>>}
 */
const replaceAvailabilityRules = async (userId, rules = []) => {
  const t = await sequelize.transaction();

  try {
    // Delete existing rules for this advocate
    await AvailabilityRule.destroy({
      where: { lawyerId: userId },
      transaction: t
    });

    let createdRules = [];
    if (rules.length > 0) {
      const recordsToInsert = rules.map((rule) => ({
        lawyerId: userId,
        weekday: rule.weekday,
        startTime: rule.startTime,
        endTime: rule.endTime
      }));

      createdRules = await AvailabilityRule.bulkCreate(recordsToInsert, {
        transaction: t,
        returning: true
      });
    }

    await t.commit();

    // Re-query sorted
    return await getAvailabilityRules(userId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * List all upcoming or active blocked dates for the advocate.
 *
 * @param {string} userId - UUID of the advocate
 * @returns {Promise<Array<object>>}
 */
const getBlockedDates = async (userId) => {
  const blockedDates = await BlockedDate.findAll({
    where: { lawyerId: userId },
    order: [['date', 'ASC']],
    attributes: ['id', 'date', 'reason', 'createdAt']
  });

  return blockedDates.map((b) => b.toJSON());
};

/**
 * Add a new blocked date to the advocate's schedule.
 *
 * @param {string} userId - UUID of the advocate
 * @param {object} param1
 * @param {string} param1.date - "YYYY-MM-DD"
 * @param {string} [param1.reason]
 * @returns {Promise<object>}
 */
const addBlockedDate = async (userId, { date, reason }) => {
  const existing = await BlockedDate.findOne({
    where: { lawyerId: userId, date }
  });

  if (existing) {
    throw new AppError('This date is already blocked in your schedule', 409);
  }

  const blocked = await BlockedDate.create({
    lawyerId: userId,
    date,
    reason: reason ? reason.trim() : null
  });

  return {
    id: blocked.id,
    date: blocked.date,
    reason: blocked.reason,
    createdAt: blocked.createdAt
  };
};

/**
 * Delete a blocked date by ID.
 *
 * @param {string} userId - UUID of the advocate
 * @param {string} blockedDateId - UUID of the blocked date record
 * @returns {Promise<object>}
 */
const deleteBlockedDate = async (userId, blockedDateId) => {
  const record = await BlockedDate.findOne({
    where: {
      id: blockedDateId,
      lawyerId: userId
    }
  });

  if (!record) {
    throw new AppError('Blocked date not found', 404);
  }

  await record.destroy();

  return {
    message: 'Blocked date removed successfully'
  };
};

/**
 * Hook for busy intervals (e.g. existing confirmed/pending appointments).
 * Queries all active consultation appointments that overlap the requested date range.
 *
 * @param {string} userId
 * @param {string} fromDate - "YYYY-MM-DD"
 * @param {string} toDate - "YYYY-MM-DD"
 * @returns {Promise<Array<object>>}
 */
const getBusyIntervals = async (userId, fromDate, toDate) => {
  const fromUtc = new Date(`${fromDate}T00:00:00+05:00`);
  const toUtc = new Date(`${toDate}T23:59:59+05:00`);

  const activeBookings = await Booking.findAll({
    where: {
      lawyerId: userId,
      status: {
        [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED]
      },
      startUtc: { [Op.lte]: toUtc },
      endUtc: { [Op.gte]: fromUtc }
    },
    attributes: ['startUtc', 'endUtc']
  });

  return activeBookings.map((b) => ({
    startUtc: b.startUtc.toISOString(),
    endUtc: b.endUtc.toISOString()
  }));
};

/**
 * Public Slot Generation Service.
 * Generates available appointment slots for an approved, public advocate.
 *
 * @param {string} applicationId - UUID of the LawyerApplication
 * @param {string} fromDate - "YYYY-MM-DD"
 * @param {string} toDate - "YYYY-MM-DD"
 * @param {Function} [nowProvider] - Optional injectable clock for tests
 * @returns {Promise<object>}
 */
const getAvailableSlots = async (applicationId, fromDate, toDate, nowProvider) => {
  const app = await LawyerApplication.findByPk(applicationId, {
    include: [
      {
        model: LawyerProfile,
        as: 'profile',
        attributes: ['slotMinutes', 'isPublic']
      }
    ]
  });

  if (!app || app.status !== APPLICATION_STATUS.APPROVED) {
    throw new AppError('Advocate profile not found or not approved', 404);
  }

  // If advocate has set isPublic to false, their schedule is not public
  if (app.profile && app.profile.isPublic === false) {
    throw new AppError('Advocate schedule is currently not available', 404);
  }

  const slotMinutes = app.profile && app.profile.slotMinutes ? app.profile.slotMinutes : 30;
  const userId = app.userId;

  // Fetch rules
  const rules = await AvailabilityRule.findAll({
    where: { lawyerId: userId },
    attributes: ['weekday', 'startTime', 'endTime']
  });

  const todayStr = getTodayKarachiDateStr();
  const effectiveFromDate = fromDate < todayStr ? todayStr : fromDate;

  // Fetch blocked dates in range
  const blockedRecords = await BlockedDate.findAll({
    where: {
      lawyerId: userId,
      date: {
        [Op.between]: [effectiveFromDate, toDate]
      }
    },
    attributes: ['date']
  });

  const blockedDates = blockedRecords.map((b) => b.date);

  // Fetch busy intervals
  const busyIntervals = await getBusyIntervals(userId, effectiveFromDate, toDate);

  // Run pure slot generator
  const slots = generateSlots({
    rules: rules.map((r) => r.toJSON()),
    blockedDates,
    busyIntervals,
    slotMinutes,
    fromDateStr: effectiveFromDate,
    toDateStr: toDate,
    now: nowProvider
  });

  return {
    lawyerId: applicationId,
    slotMinutes,
    timezone: TIMEZONE,
    from: fromDate,
    to: toDate,
    totalAvailableSlots: slots.length,
    slots
  };
};

module.exports = {
  getAvailabilityRules,
  replaceAvailabilityRules,
  getBlockedDates,
  addBlockedDate,
  deleteBlockedDate,
  getBusyIntervals,
  getAvailableSlots
};
