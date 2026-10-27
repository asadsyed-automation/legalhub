const caseService = require('./case.service');

const createCase = async (req, res, next) => {
  try {
    const result = await caseService.createCase(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Case file created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getCases = async (req, res, next) => {
  try {
    const result = await caseService.getCases(req.user, req.query);
    res.status(200).json({
      success: true,
      message: 'Cases retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getCaseById = async (req, res, next) => {
  try {
    const result = await caseService.getCaseById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Case file retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updateCase = async (req, res, next) => {
  try {
    const result = await caseService.updateCase(req.params.id, req.user, req.body);
    res.status(200).json({
      success: true,
      message: 'Case file updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  updateCase
};
