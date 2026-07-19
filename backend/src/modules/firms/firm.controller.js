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

module.exports = { create, getOne };