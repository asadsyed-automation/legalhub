const { createProfile, getAllProfiles, getProfileById, updateProfile } = require('./profile.service');

async function create(req, res) {
  try {
    const profile = await createProfile({
      lawyerId: req.user.id,
      bio: req.body.bio,
      specialization: req.body.specialization,
      feeStructure: req.body.fee_structure,
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAll(req, res) {
  try {
    const profiles = await getAllProfiles();
    res.json(profiles);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const profile = await getProfileById(req.params.id);
    res.json(profile);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const profile = await updateProfile({ lawyerId: req.user.id, updates: req.body });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getAll, getOne, update };