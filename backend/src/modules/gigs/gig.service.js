const Gig = require('./gig.model');
const MarketplaceProfile = require('../marketplace/profile.model');

async function getOrCreateProfile(lawyerId) {
  let profile = await MarketplaceProfile.findOne({ where: { lawyer_id: lawyerId } });
  if (!profile) {
    profile = await MarketplaceProfile.create({
      lawyer_id: lawyerId,
      specialization: 'General Practice & Litigation',
      bio: 'Verified Advocate on LegalHub Pakistan.',
      fee_structure: 'Standard Consultation',
      is_verified: true,
    });
  }
  return profile;
}

async function createGig({ lawyerId, title, description, price, thumbnail_url }) {
  const profile = await getOrCreateProfile(lawyerId);
  return await Gig.create({ profile_id: profile.id, title, description, price, thumbnail_url });
}

async function getGigsForProfile(profileId) {
  return await Gig.findAll({ where: { profile_id: profileId }, order: [['created_at', 'DESC']] });
}

async function getMyGigs(lawyerId) {
  const profile = await getOrCreateProfile(lawyerId);
  return await Gig.findAll({ where: { profile_id: profile.id }, order: [['created_at', 'DESC']] });
}

async function updateGig({ lawyerId, gigId, title, description, price, thumbnail_url }) {
  const profile = await getOrCreateProfile(lawyerId);
  const gig = await Gig.findOne({ where: { id: gigId, profile_id: profile.id } });
  if (!gig) throw new Error('Gig not found or unauthorized');

  await gig.update({
    title: title !== undefined ? title : gig.title,
    description: description !== undefined ? description : gig.description,
    price: price !== undefined ? price : gig.price,
    thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : gig.thumbnail_url,
  });

  return gig;
}

async function deleteGig({ lawyerId, gigId }) {
  const profile = await getOrCreateProfile(lawyerId);
  const gig = await Gig.findOne({ where: { id: gigId, profile_id: profile.id } });
  if (!gig) throw new Error('Gig not found or unauthorized');

  await gig.destroy();
  return { message: 'Gig deleted successfully', id: gigId };
}

module.exports = {
  createGig,
  getGigsForProfile,
  getMyGigs,
  updateGig,
  deleteGig,
};