const Case = require('./case.model');
const { CASE_STATUSES, CASE_TYPES } = require('../../constants/case.constants');

async function createCase({ lawyerId, clientId, caseNumber, courtName, caseType }) {
  if (!CASE_TYPES.includes(caseType)) {
    throw new Error(`Invalid case_type. Must be one of: ${CASE_TYPES.join(', ')}`);
  }

  const newCase = await Case.create({
    lawyer_id: lawyerId,
    client_id: clientId || null,
    case_number: caseNumber,
    court_name: courtName,
    case_type: caseType,
    status: 'Open',
  });

  return newCase;
}

async function getCasesForUser({ userId, role }) {
  if (role === 'lawyer') {
    return await Case.findAll({ where: { lawyer_id: userId } });
  }
  if (role === 'citizen') {
    return await Case.findAll({ where: { client_id: userId } });
  }
  // Admin sees everything (handled separately in Task 3.6 if needed)
  return await Case.findAll();
}

async function getCaseById({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');

  // Authorization check: only the assigned lawyer or client can view it
  if (role === 'lawyer' && foundCase.lawyer_id !== userId) {
    throw new Error('Access denied');
  }
  if (role === 'citizen' && foundCase.client_id !== userId) {
    throw new Error('Access denied');
  }

  return foundCase;
}

async function updateCaseStatus({ caseId, userId, role, newStatus }) {
  if (role !== 'lawyer') {
    throw new Error('Only lawyers can change case status');
  }
  if (!CASE_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${CASE_STATUSES.join(', ')}`);
  }

  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (foundCase.lawyer_id !== userId) throw new Error('Access denied');

  foundCase.status = newStatus;
  await foundCase.save();
  return foundCase;
}

module.exports = { createCase, getCasesForUser, getCaseById, updateCaseStatus };