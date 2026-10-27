const hearingService = require('./hearing.service');

/**
 * Controller for scheduling a court hearing.
 * POST /api/v1/cases/:id/hearings
 */
const createHearing = async (req, res, next) => {
  try {
    const hearing = await hearingService.createHearing(req.params.id, req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Court hearing scheduled successfully',
      data: hearing
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for retrieving hearings for a case.
 * GET /api/v1/cases/:id/hearings
 */
const getCaseHearings = async (req, res, next) => {
  try {
    const result = await hearingService.getCaseHearings(req.params.id, req.user, req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for updating full hearing details.
 * PATCH /api/v1/cases/:id/hearings/:hearingId
 */
const updateHearing = async (req, res, next) => {
  try {
    const hearing = await hearingService.updateHearing(
      req.params.id,
      req.params.hearingId,
      req.user,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Court hearing updated successfully',
      data: hearing
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for quick outcome recording.
 * PATCH /api/v1/hearings/:id/outcome
 */
const quickOutcomeHearing = async (req, res, next) => {
  try {
    const hearing = await hearingService.quickOutcomeHearing(
      req.params.id,
      req.user,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Hearing outcome recorded successfully',
      data: hearing
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for cross-case cause list queries.
 * GET /api/v1/hearings?from=&to=&court=
 */
const listHearingsAcrossCases = async (req, res, next) => {
  try {
    const result = await hearingService.listHearingsAcrossCases(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHearing,
  getCaseHearings,
  updateHearing,
  quickOutcomeHearing,
  listHearingsAcrossCases
};
