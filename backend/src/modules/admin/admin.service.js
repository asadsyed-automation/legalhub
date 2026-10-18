const { LawyerApplication, User } = require('../../models');
const { APPLICATION_STATUS } = require('../../constants');
const AppError = require('../../utils/AppError');

/**
 * List lawyer applications with optional status filtering.
 *
 * @param {object} filters - { status?: 'pending' | 'approved' | 'rejected' }
 * @returns {Promise<Array<LawyerApplication>>}
 */
const listApplications = async ({ status } = {}) => {
  const where = {};
  if (status) {
    where.status = status;
  }

  const applications = await LawyerApplication.findAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return applications;
};

/**
 * Approve a pending lawyer application.
 * Strictly allowed ONLY when current status is 'pending', otherwise returns 409 Conflict.
 *
 * @param {string} applicationId - UUID of the application
 * @param {string} adminId - UUID of the reviewing administrator
 * @returns {Promise<LawyerApplication>}
 */
const approveApplication = async (applicationId, adminId) => {
  const application = await LawyerApplication.findByPk(applicationId);
  if (!application) {
    throw new AppError('Lawyer application not found', 404);
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw new AppError(
      `Only pending applications can be approved. Current status is '${application.status}'`,
      409
    );
  }

  await application.update({
    status: APPLICATION_STATUS.APPROVED,
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason: null
  });

  return application;
};

/**
 * Reject a pending lawyer application with a reason.
 * Strictly allowed ONLY when current status is 'pending', otherwise returns 409 Conflict.
 *
 * @param {string} applicationId - UUID of the application
 * @param {string} adminId - UUID of the reviewing administrator
 * @param {string} rejectionReason - Min 10 character explanation
 * @returns {Promise<LawyerApplication>}
 */
const rejectApplication = async (applicationId, adminId, rejectionReason) => {
  const application = await LawyerApplication.findByPk(applicationId);
  if (!application) {
    throw new AppError('Lawyer application not found', 404);
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw new AppError(
      `Only pending applications can be rejected. Current status is '${application.status}'`,
      409
    );
  }

  await application.update({
    status: APPLICATION_STATUS.REJECTED,
    rejectionReason: rejectionReason.trim(),
    reviewedBy: adminId,
    reviewedAt: new Date()
  });

  return application;
};

module.exports = {
  listApplications,
  approveApplication,
  rejectApplication
};
