const MarketplaceProfile = require('./profile.model');

async function createProfile({ lawyerId, bio, specialization, feeStructure }) {
  const existing = await MarketplaceProfile.findOne({ where: { lawyer_id: lawyerId } });
  if (existing) throw new Error('Profile already exists for this lawyer');

  return await MarketplaceProfile.create({
    lawyer_id: lawyerId,
    bio,
    specialization,
    fee_structure: feeStructure,
  });
}

async function getAllProfiles() {
  // Only show verified profiles publicly — unverified lawyers shouldn't appear in marketplace search
  return await MarketplaceProfile.findAll({ where: { is_verified: true } });
}

async function getProfileById(id) {
  const profile = await MarketplaceProfile.findByPk(id);
  if (!profile) throw new Error('Profile not found');
  return profile;
}

async function updateProfile({ lawyerId, updates }) {
  const profile = await MarketplaceProfile.findOne({ where: { lawyer_id: lawyerId } });
  if (!profile) throw new Error('Profile not found');

  await profile.update(updates);
  return profile;
}

module.exports = { createProfile, getAllProfiles, getProfileById, updateProfile };