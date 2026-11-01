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

/**
 * Handle listing users with pagination, filtering, and search.
 */
const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  res.status(200).json(result);
});

/**
 * Handle updating user status (suspend or reinstate).
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserStatus(req.params.id, req.body, req.user.id);
  res.status(200).json({
    user,
    message: `User status successfully updated to ${req.body.status}`
  });
});

module.exports = {
  listApplications,
  approveApplication,
  rejectApplication,
  listUsers,
  updateUserStatus
};
