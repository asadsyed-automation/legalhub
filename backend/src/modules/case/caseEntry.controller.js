const caseEntryService = require('./caseEntry.service');

/**
 * Controller for creating a case diary entry.
 * POST /api/v1/cases/:id/entries
 */
const createEntry = async (req, res, next) => {
  try {
    const entry = await caseEntryService.createEntry(req.params.id, req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Case diary entry created successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for listing case diary entries.
 * GET /api/v1/cases/:id/entries
 */
const getEntries = async (req, res, next) => {
  try {
    const result = await caseEntryService.getEntries(req.params.id, req.user, req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for modifying a case diary entry.
 * PATCH /api/v1/cases/:id/entries/:entryId
 */
const updateEntry = async (req, res, next) => {
  try {
    const entry = await caseEntryService.updateEntry(
      req.params.id,
      req.params.entryId,
      req.user,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Case diary entry updated successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEntry,
  getEntries,
  updateEntry
};
