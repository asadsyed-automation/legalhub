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

async function submitPaymentReceipt({ feeId, clientId, receiptUrl, paymentMethod, transactionId }) {
  const fee = await Fee.findByPk(feeId);
  if (!fee) throw new Error('Fee invoice not found');

  const foundCase = await Case.findByPk(fee.case_id);
  if (foundCase.client_id !== clientId) throw new Error('Access denied');

  fee.receipt_url = receiptUrl;
  fee.payment_method = paymentMethod || 'JazzCash / EasyPaisa / Bank Transfer';
  fee.transaction_id = transactionId;
  fee.status = 'Pending_Verification';
  await fee.save();

  return fee;
}

async function verifyPaymentReceipt({ feeId, lawyerId, approved, rejectionReason }) {
  const fee = await Fee.findByPk(feeId);
  if (!fee) throw new Error('Fee invoice not found');

  const foundCase = await Case.findByPk(fee.case_id);
  if (foundCase.lawyer_id !== lawyerId) throw new Error('Access denied');

  if (approved) {
    fee.status = 'Paid';
    fee.rejection_reason = null;
  } else {
    fee.status = 'Rejected';
    fee.rejection_reason = rejectionReason || 'Receipt verification failed. Please re-upload valid proof.';
  }

  await fee.save();
  return fee;
}

async function getFeesForCase({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (role === 'lawyer' && foundCase.lawyer_id !== userId) throw new Error('Access denied');
  if (role === 'citizen' && foundCase.client_id !== userId) throw new Error('Access denied');

  return await Fee.findAll({ where: { case_id: caseId }, order: [['created_at', 'DESC']] });
}

module.exports = { addFee, updateFeeStatus, submitPaymentReceipt, verifyPaymentReceipt, getFeesForCase };