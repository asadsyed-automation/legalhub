const CaseEntry = require('./entry.model');
const Case = require('../cases/case.model');

async function addEntry({ caseId, lawyerId, entryText }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (foundCase.lawyer_id !== lawyerId) throw new Error('Access denied');

  const entry = await CaseEntry.create({
    case_id: caseId,
    entry_text: entryText,
    ai_summary: null,
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

async function getAISummary({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (role === 'lawyer' && foundCase.lawyer_id !== userId) throw new Error('Access denied');
  if (role === 'citizen' && foundCase.client_id !== userId) throw new Error('Access denied');

  const entries = await CaseEntry.findAll({
    where: { case_id: caseId },
    order: [['created_at', 'ASC']]
  });

  if (!entries || entries.length === 0) {
    return { summary: null, keywords: [], available: true, isFirstEntry: true };
  }

  const entryTexts = entries.map(e => e.entry_text).filter(t => t && t.trim());
  if (entryTexts.length === 0) {
    return { summary: null, keywords: [], available: true, isFirstEntry: true };
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${aiServiceUrl}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: entryTexts }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { summary: null, keywords: [], available: false };
    }

    const data = await response.json();
    return {
      summary: data.summary,
      keywords: data.keywords || [],
      available: true,
      isFirstEntry: false
    };
  } catch (err) {
    return { summary: null, keywords: [], available: false, error: err.message };
  }
}

module.exports = { addEntry, getEntriesForCase, getAISummary };