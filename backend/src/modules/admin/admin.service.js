const { Op } = require('sequelize');
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

/**
 * List all users with pagination, role filtering, status filtering, and search.
 *
 * @param {object} query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=10]
 * @param {string} [query.role]
 * @param {'active'|'suspended'|'all'} [query.status='all']
 * @param {string} [query.search]
 * @returns {Promise<{ users: Array<object>, pagination: object }>}
 */
const listUsers = async ({ page = 1, limit = 10, role, status = 'all', search } = {}) => {
  const where = {};

  if (role) {
    where.role = role;
  }

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'suspended') {
    where.isActive = false;
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } }
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Update a user's active status (suspend or reinstate).
 * Prevents an admin from suspending themselves.
 *
 * @param {string} targetUserId - Target User UUID
 * @param {object} payload - { status: 'active' | 'suspended', reason?: string }
 * @param {string} adminUserId - Authenticated Admin User UUID
 * @returns {Promise<User>}
 */
const updateUserStatus = async (targetUserId, { status, reason }, adminUserId) => {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.id === adminUserId) {
    throw new AppError('Administrators cannot suspend their own account', 400);
  }

  if (status === 'suspended') {
    await user.update({
      isActive: false,
      suspensionReason: reason ? reason.trim() : null,
      suspendedAt: new Date()
    });
  } else {
    await user.update({
      isActive: true,
      suspensionReason: null,
      suspendedAt: null
    });
  }

  return user.toJSON();
};

module.exports = {
  listApplications,
  approveApplication,
  rejectApplication,
  listUsers,
  updateUserStatus
};

