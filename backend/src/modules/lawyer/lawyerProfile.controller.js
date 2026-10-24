const lawyerProfileService = require('./lawyerProfile.service');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle retrieving advocate's profile details.
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await lawyerProfileService.getProfile(req.user.id);
  res.status(200).json({ profile });
});

/**
 * Handle upserting advocate's profile details.
 */
const upsertProfile = asyncHandler(async (req, res) => {
  const profile = await lawyerProfileService.upsertProfile(req.user.id, req.body);
  res.status(200).json({ profile });
});

/**
 * Handle retrieving advocate's consultation services.
 */
const getServices = asyncHandler(async (req, res) => {
  const services = await lawyerProfileService.getServices(req.user.id);
  res.status(200).json({ services });
});

/**
 * Handle replacing advocate's full set of consultation services.
 */
const updateServices = asyncHandler(async (req, res) => {
  const services = await lawyerProfileService.replaceServices(req.user.id, req.body.services);
  res.status(200).json({ services });
});

module.exports = {
  getProfile,
  upsertProfile,
  getServices,
  updateServices
};
