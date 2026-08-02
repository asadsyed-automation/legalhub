const MarketplaceProfile = require('./profile.model');
const User = require('../auth/auth.model');

async function createProfile({ lawyerId, bio, specialization, feeStructure, whatsapp_number }) {
  const existing = await MarketplaceProfile.findOne({ where: { lawyer_id: lawyerId } });
  if (existing) throw new Error('Profile already exists for this lawyer');

  const created = await MarketplaceProfile.create({
    lawyer_id: lawyerId,
    bio,
    specialization,
    fee_structure: feeStructure,
    whatsapp_number,
  });

  return await getMyProfile(lawyerId);
}

async function getAllProfiles() {
  // Only show verified profiles publicly — strip private whatsapp_number from public listing
  const profiles = await MarketplaceProfile.findAll({
    where: { is_verified: true },
    include: [{ model: User, as: 'lawyer', attributes: ['id', 'name', 'email'] }],
  });

  return profiles.map((p) => {
    const plain = p.get({ plain: true });
    delete plain.whatsapp_number;
    return plain;
  });
}

async function getProfileById(id) {
  const profile = await MarketplaceProfile.findByPk(id, {
    include: [{ model: User, as: 'lawyer', attributes: ['id', 'name', 'email'] }],
  });
  if (!profile) throw new Error('Profile not found');
  const plain = profile.get({ plain: true });
  delete plain.whatsapp_number;
  return plain;
}

async function getMyProfile(lawyerId) {
  // Returns full profile including whatsapp_number to the lawyer owner
  return await MarketplaceProfile.findOne({
    where: { lawyer_id: lawyerId },
    include: [{ model: User, as: 'lawyer', attributes: ['id', 'name', 'email'] }],
  });
}

async function updateProfile({ lawyerId, updates }) {
  const profile = await MarketplaceProfile.findOne({ where: { lawyer_id: lawyerId } });
  if (!profile) throw new Error('Profile not found');

  await profile.update(updates);
  return await getMyProfile(lawyerId);
}

module.exports = { createProfile, getAllProfiles, getProfileById, getMyProfile, updateProfile };