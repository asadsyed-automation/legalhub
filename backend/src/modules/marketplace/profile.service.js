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
    is_verified: true,
  });

  return await getMyProfile(lawyerId);
}

async function getAllProfiles() {
  let profiles = await MarketplaceProfile.findAll({
    include: [{ model: User, as: 'lawyer', attributes: ['id', 'name', 'email'] }],
    order: [['is_verified', 'DESC'], ['created_at', 'DESC']],
  });

  // Self-Healing: If database returns fewer than 3 profiles, trigger marketplace seeder on the fly
  if (profiles.length < 3) {
    try {
      const { seedMarketplaceDummyData } = require('../../server');
      if (typeof seedMarketplaceDummyData === 'function') {
        await seedMarketplaceDummyData();
        profiles = await MarketplaceProfile.findAll({
          include: [{ model: User, as: 'lawyer', attributes: ['id', 'name', 'email'] }],
          order: [['is_verified', 'DESC'], ['created_at', 'DESC']],
        });
      }
    } catch (err) {
      console.error('Auto-seed check error:', err.message);
    }
  }

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