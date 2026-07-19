const Firm = require('./firm.model');
const User = require('../auth/auth.model');

async function createFirm({ name, ownerId }) {
  const firm = await Firm.create({ name, owner_id: ownerId });
  await User.update({ firm_id: firm.id }, { where: { id: ownerId } });
  return firm;
}

async function getFirmById(id) {
  const firm = await Firm.findByPk(id);
  if (!firm) throw new Error('Firm not found');
  return firm;
}

module.exports = { createFirm, getFirmById };