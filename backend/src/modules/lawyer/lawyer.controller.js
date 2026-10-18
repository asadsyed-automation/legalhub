const lawyerService = require('./lawyer.service');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle new lawyer application submission.
 */
const submitApplication = asyncHandler(async (req, res) => {
  const application = await lawyerService.submitApplication(req.user.id, req.body);
  res.status(201).json({ application });
});

/**
 * Handle fetching current authenticated lawyer's application.
 */
const getMyApplication = asyncHandler(async (req, res) => {
  const application = await lawyerService.getMyApplication(req.user.id);
  res.status(200).json({ application });
});

/**
 * Handle updating rejected application back to pending.
 */
const updateApplication = asyncHandler(async (req, res) => {
  const application = await lawyerService.updateApplication(req.user.id, req.body);
  res.status(200).json({ application });
});

module.exports = {
  submitApplication,
  getMyApplication,
  updateApplication
};
