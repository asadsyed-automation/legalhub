const {
  getPendingLawyers, approveLawyer, rejectLawyer,
  verifyMarketplaceProfile, getAllUsers, getAllMarketplaceProfiles,
} = require('./admin.service');

async function getPending(req, res) {
  try {
    const lawyers = await getPendingLawyers();
    res.json(lawyers.map(l => ({ id: l.id, name: l.name, email: l.email })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function approve(req, res) {
  try {
    const user = await approveLawyer(req.params.id);
    res.json({ id: user.id, is_verified: user.is_verified });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function reject(req, res) {
  try {
    const user = await rejectLawyer({ userId: req.params.id, reason: req.body.reason });
    res.json({ id: user.id, is_verified: user.is_verified, rejection_reason: user.rejection_reason });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function verifyProfile(req, res) {
  try {
    const profile = await verifyMarketplaceProfile(req.params.id);
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listAllUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listAllMarketplaceProfiles(req, res) {
  try {
    const profiles = await getAllMarketplaceProfiles();
    res.json(profiles);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getPending, approve, reject, verifyProfile, listAllUsers, listAllMarketplaceProfiles };