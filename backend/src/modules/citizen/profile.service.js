const CitizenProfile = require('./profile.model');
const User = require('../auth/auth.model');
const Case = require('../cases/case.model');

async function getOrCreateCitizenProfile(citizenId) {
  let profile = await CitizenProfile.findOne({
    where: { citizen_id: citizenId },
    include: [{ model: User, as: 'citizen', attributes: ['id', 'name', 'email', 'role', 'createdAt'] }]
  });

  if (!profile) {
    const user = await User.findByPk(citizenId);
    profile = await CitizenProfile.create({
      citizen_id: citizenId,
      city: 'Lahore',
      preferred_specialization: 'General Legal Assistance',
      legal_summary: 'Seeking legal guidance and consultation on LegalHub.'
    });
    profile = await CitizenProfile.findOne({
      where: { citizen_id: citizenId },
      include: [{ model: User, as: 'citizen', attributes: ['id', 'name', 'email', 'role', 'createdAt'] }]
    });
  }

  return profile;
}

async function updateCitizenProfile(citizenId, updateData) {
  const profile = await getOrCreateCitizenProfile(citizenId);
  await profile.update(updateData);
  return getOrCreateCitizenProfile(citizenId);
}

async function getCitizenProfileById(citizenId) {
  const profile = await getOrCreateCitizenProfile(citizenId);
  const activeCasesCount = await Case.count({ where: { client_id: citizenId } });

  return {
    ...profile.toJSON(),
    activeCasesCount
  };
}

module.exports = {
  getOrCreateCitizenProfile,
  updateCitizenProfile,
  getCitizenProfileById
};
