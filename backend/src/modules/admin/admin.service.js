const User = require('../auth/auth.model');
const MarketplaceProfile = require('../marketplace/profile.model');

async function getPendingLawyers() {
  return await User.findAll({ where: { role: 'lawyer', is_verified: false } });
}

async function approveLawyer(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  user.is_verified = true;
  user.rejection_reason = null;
  await user.save();
  return user;
}

async function rejectLawyer({ userId, reason }) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  user.is_verified = false;
  user.rejection_reason = reason;
  await user.save();
  return user;
}

async function verifyMarketplaceProfile(profileId) {
  const profile = await MarketplaceProfile.findByPk(profileId);
  if (!profile) throw new Error('Profile not found');
  profile.is_verified = true;
  await profile.save();
  return profile;
}

async function getAllUsers() {
  return await User.findAll({ attributes: { exclude: ['password_hash'] } });
}

async function getAllMarketplaceProfiles() {
  return await MarketplaceProfile.findAll({ order: [['created_at', 'DESC']] });
}

module.exports = { getPendingLawyers, approveLawyer, rejectLawyer, verifyMarketplaceProfile, getAllUsers, getAllMarketplaceProfiles };