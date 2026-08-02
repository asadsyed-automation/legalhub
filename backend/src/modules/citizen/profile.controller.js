const citizenService = require('./profile.service');

async function getMyProfile(req, res) {
  try {
    const profile = await citizenService.getOrCreateCitizenProfile(req.user.id);
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateMyProfile(req, res) {
  try {
    const { phone_number, city, legal_summary, preferred_specialization, budget_range, avatar_url } = req.body;
    const profile = await citizenService.updateCitizenProfile(req.user.id, {
      phone_number, city, legal_summary, preferred_specialization, budget_range, avatar_url
    });
    return res.json(profile);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getPublicCitizenProfile(req, res) {
  try {
    const profile = await citizenService.getCitizenProfileById(req.params.citizenId);
    return res.json(profile);
  } catch (err) {
    return res.status(404).json({ error: 'Citizen profile not found' });
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicCitizenProfile
};
