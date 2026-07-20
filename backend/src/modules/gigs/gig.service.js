const Gig = require('./gig.model');
const MarketplaceProfile = require('../marketplace/profile.model');

async function createGig({ lawyerId, title, description, price }) {
  const profile = await MarketplaceProfile.findOne({ where: { lawyer_id: lawyerId } });
  if (!profile) throw new Error('You must create a marketplace profile first');

  return await Gig.create({ profile_id: profile.id, title, description, price });
}

async function getGigsForProfile(profileId) {
  return await Gig.findAll({ where: { profile_id: profileId } });
}

module.exports = { createGig, getGigsForProfile };