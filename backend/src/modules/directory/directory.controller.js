const directoryService = require('./directory.service');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle listing approved lawyers with pagination and filters.
 */
const getPublicLawyers = asyncHandler(async (req, res) => {
  const result = await directoryService.getPublicLawyers(req.query);
  res.status(200).json(result);
});

/**
 * Handle retrieving public details of an approved lawyer by ID.
 */
const getPublicLawyerById = asyncHandler(async (req, res) => {
  const lawyer = await directoryService.getPublicLawyerById(req.params.id);
  res.status(200).json({ lawyer });
});

module.exports = {
  getPublicLawyers,
  getPublicLawyerById
};
