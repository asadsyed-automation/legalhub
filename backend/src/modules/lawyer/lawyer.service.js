const { Op } = require('sequelize');
const { LawyerApplication } = require('../../models');
const { APPLICATION_STATUS } = require('../../constants');
const AppError = require('../../utils/AppError');

/**
 * Submit a new lawyer onboarding application.
 *
 * @param {string} userId - ID of the authenticated lawyer
 * @param {object} data - Validated application payload
 * @returns {Promise<LawyerApplication>}
 */
const submitApplication = async (userId, data) => {
  // Rule: Strictly one application per lawyer user
  const existingApp = await LawyerApplication.findOne({ where: { userId } });
  if (existingApp) {
    throw new AppError('You have already submitted a lawyer application', 409);
  }

  // Rule: Composite unique check on (barCouncil, enrolmentNo)
  const duplicateLicense = await LawyerApplication.findOne({
    where: {
      barCouncil: data.barCouncil,
      enrolmentNo: data.enrolmentNo.trim()
    }
  });

  if (duplicateLicense) {
    throw new AppError('An application with this Bar Council enrolment number already exists', 409);
  }

  const application = await LawyerApplication.create({
    userId,
    barCouncil: data.barCouncil,
    enrolmentNo: data.enrolmentNo.trim(),
    courtLevel: data.courtLevel,
    city: data.city,
    practiceAreas: data.practiceAreas,
    experienceYears: data.experienceYears,
    chamberAddress: data.chamberAddress.trim(),
    bio: data.bio ? data.bio.trim() : null,
    status: APPLICATION_STATUS.PENDING,
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null
  });

  return application;
};

/**
 * Fetch the current authenticated lawyer's application.
 *
 * @param {string} userId
 * @returns {Promise<LawyerApplication>}
 */
const getMyApplication = async (userId) => {
  const application = await LawyerApplication.findOne({ where: { userId } });
  if (!application) {
    throw new AppError('Lawyer application not found', 404);
  }
  return application;
};

/**
 * Re-submit an application after rejection.
 * Strictly allowed ONLY when current status is 'rejected'.
 * Returns status to 'pending' and clears rejectionReason.
 *
 * @param {string} userId
 * @param {object} data
 * @returns {Promise<LawyerApplication>}
 */
const updateApplication = async (userId, data) => {
  const application = await LawyerApplication.findOne({ where: { userId } });
  if (!application) {
    throw new AppError('Lawyer application not found', 404);
  }

  // Rule: PUT only when status is rejected
  if (application.status !== APPLICATION_STATUS.REJECTED) {
    throw new AppError(
      `Applications can only be modified when rejected. Current status is '${application.status}'`,
      409
    );
  }

  // Rule: Ensure new (barCouncil, enrolmentNo) doesn't collide with another lawyer's record
  const licenseConflict = await LawyerApplication.findOne({
    where: {
      barCouncil: data.barCouncil,
      enrolmentNo: data.enrolmentNo.trim(),
      id: { [Op.ne]: application.id }
    }
  });

  if (licenseConflict) {
    throw new AppError('An application with this Bar Council enrolment number already exists', 409);
  }

  await application.update({
    barCouncil: data.barCouncil,
    enrolmentNo: data.enrolmentNo.trim(),
    courtLevel: data.courtLevel,
    city: data.city,
    practiceAreas: data.practiceAreas,
    experienceYears: data.experienceYears,
    chamberAddress: data.chamberAddress.trim(),
    bio: data.bio ? data.bio.trim() : null,
    status: APPLICATION_STATUS.PENDING,
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null
  });

  return application;
};

module.exports = {
  submitApplication,
  getMyApplication,
  updateApplication
};
