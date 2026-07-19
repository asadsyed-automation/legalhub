const CaseEntry = require('./entry.model');
const Case = require('../cases/case.model');

async function addEntry({ caseId, lawyerId, entryText }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (foundCase.lawyer_id !== lawyerId) throw new Error('Access denied');

  const entry = await CaseEntry.create({
    case_id: caseId,
    entry_text: entryText,
    ai_summary: null, // Phase 10 will populate this via the AI service
  });

  return entry;
}

async function getEntriesForCase({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (role === 'lawyer' && foundCase.lawyer_id !== userId) throw new Error('Access denied');
  if (role === 'citizen' && foundCase.client_id !== userId) throw new Error('Access denied');

  return await CaseEntry.findAll({ where: { case_id: caseId }, order: [['created_at', 'DESC']] });
}

module.exports = { addEntry, getEntriesForCase };