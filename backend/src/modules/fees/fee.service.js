const Fee = require('./fee.model');
const Case = require('../cases/case.model');

async function addFee({ caseId, lawyerId, amount }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (foundCase.lawyer_id !== lawyerId) throw new Error('Access denied');

  return await Fee.create({ case_id: caseId, amount, status: 'Pending' });
}

async function updateFeeStatus({ feeId, lawyerId, newStatus }) {
  const fee = await Fee.findByPk(feeId);
  if (!fee) throw new Error('Fee not found');

  const foundCase = await Case.findByPk(fee.case_id);
  if (foundCase.lawyer_id !== lawyerId) throw new Error('Access denied');

  fee.status = newStatus;
  await fee.save();
  return fee;
}

async function getFeesForCase({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (role === 'lawyer' && foundCase.lawyer_id !== userId) throw new Error('Access denied');
  if (role === 'citizen' && foundCase.client_id !== userId) throw new Error('Access denied');

  return await Fee.findAll({ where: { case_id: caseId } });
}

module.exports = { addFee, updateFeeStatus, getFeesForCase };