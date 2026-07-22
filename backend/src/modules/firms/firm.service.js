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

async function addLawyerToFirm({ firmId, ownerId, lawyerEmail }) {
  const firm = await Firm.findByPk(firmId);
  if (!firm) throw new Error('Firm not found');
  if (firm.owner_id !== ownerId) throw new Error('Only the firm owner can add members');

  const lawyer = await User.findOne({ where: { email: lawyerEmail, role: 'lawyer' } });
  if (!lawyer) throw new Error('Lawyer not found with this email');

  lawyer.firm_id = firmId;
  await lawyer.save();
  return lawyer;
}

async function getFirmMembers(firmId) {
  return await User.findAll({
    where: { firm_id: firmId },
    attributes: ['id', 'name', 'email', 'role'],
  });
}

module.exports = { createFirm, getFirmById, addLawyerToFirm, getFirmMembers };