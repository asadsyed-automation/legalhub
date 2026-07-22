const { createFirm, getFirmById } = require('./firm.service');

async function create(req, res) {
  try {
    const firm = await createFirm({ name: req.body.name, ownerId: req.user.id });
    res.status(201).json(firm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const firm = await getFirmById(req.params.id);
    res.json(firm);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function addMember(req, res) {
  try {
    const lawyer = await addLawyerToFirm({
      firmId: req.params.id,
      ownerId: req.user.id,
      lawyerEmail: req.body.email,
    });
    res.json({ id: lawyer.id, name: lawyer.name, email: lawyer.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMembers(req, res) {
  try {
    const members = await getFirmMembers(req.params.id);
    res.json(members);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getOne, addMember, getMembers };