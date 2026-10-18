const adminService = require('./admin.service');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle listing lawyer applications for admin review.
 */
const listApplications = asyncHandler(async (req, res) => {
  const applications = await adminService.listApplications(req.query);
  res.status(200).json({ applications });
});

/**
 * Handle approving a pending lawyer application.
 */
const approveApplication = asyncHandler(async (req, res) => {
  const application = await adminService.approveApplication(req.params.id, req.user.id);
  res.status(200).json({ application });
});

/**
 * Handle rejecting a pending lawyer application.
 */
const rejectApplication = asyncHandler(async (req, res) => {
  const application = await adminService.rejectApplication(
    req.params.id,
    req.user.id,
    req.body.rejectionReason
  );
  res.status(200).json({ application });
});

module.exports = {
  listApplications,
  approveApplication,
  rejectApplication
};
