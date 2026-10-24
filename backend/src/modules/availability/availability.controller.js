const availabilityService = require('./availability.service');

/**
 * GET /api/v1/lawyer/availability
 * Fetch weekly availability rules for authenticated advocate.
 */
const getRules = async (req, res, next) => {
  try {
    const rules = await availabilityService.getAvailabilityRules(req.user.id);
    return res.status(200).json(rules);
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/v1/lawyer/availability
 * Full replacement of weekly availability rules.
 */
const putRules = async (req, res, next) => {
  try {
    const rules = await availabilityService.replaceAvailabilityRules(
      req.user.id,
      req.body.rules
    );
    return res.status(200).json(rules);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/lawyer/blocked-dates
 * List blocked dates for authenticated advocate.
 */
const getBlockedDates = async (req, res, next) => {
  try {
    const blockedDates = await availabilityService.getBlockedDates(req.user.id);
    return res.status(200).json(blockedDates);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/lawyer/blocked-dates
 * Add a new blocked date.
 */
const postBlockedDate = async (req, res, next) => {
  try {
    const blocked = await availabilityService.addBlockedDate(
      req.user.id,
      req.body
    );
    return res.status(201).json(blocked);
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/v1/lawyer/blocked-dates/:id
 * Remove a blocked date by ID.
 */
const deleteBlockedDate = async (req, res, next) => {
  try {
    const result = await availabilityService.deleteBlockedDate(
      req.user.id,
      req.params.id
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/lawyers/:id/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Public slot query for an approved advocate.
 */
const getPublicSlots = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const slotsData = await availabilityService.getAvailableSlots(
      req.params.id,
      from,
      to
    );
    return res.status(200).json(slotsData);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getRules,
  putRules,
  getBlockedDates,
  postBlockedDate,
  deleteBlockedDate,
  getPublicSlots
};
