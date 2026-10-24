const { LawyerApplication } = require('../models');
const { ROLES, APPLICATION_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
  * Middleware to ensure the authenticated user is an advocate with an APPROVED application.
  */
const requireApprovedLawyer = asyncHandler(async (req, res, next) => {
  if (!req.user || (req.user.role !== ROLES.LAWYER && req.user.role !== ROLES.LAW_FIRM)) {
    return next(new AppError('Access restricted to advocates only.', 403));
  }

  const application = await LawyerApplication.findOne({
    where: { userId: req.user.id }
  });

  if (!application) {
    return next(
      new AppError(
        'You must submit and receive administrative approval for your advocate application before configuring profiles or services.',
        403
      )
    );
  }

  if (application.status !== APPLICATION_STATUS.APPROVED) {
    return next(
      new AppError(
        `Only approved advocates can manage professional profiles and services. Your current application status is '${application.status}'.`,
        403
      )
    );
  }

  req.lawyerApplication = application;
  next();
});

module.exports = requireApprovedLawyer;
