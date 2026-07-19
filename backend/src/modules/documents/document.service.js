const Document = require('./document.model');
const Case = require('../cases/case.model');

async function uploadDocument({ caseId, uploadedBy, fileUrl, isShared }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (foundCase.lawyer_id !== uploadedBy) throw new Error('Access denied');

  return await Document.create({
    case_id: caseId,
    uploaded_by: uploadedBy,
    file_url: fileUrl,
    is_shared_with_client: isShared || false,
  });
}

async function getDocumentsForCase({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (role === 'lawyer' && foundCase.lawyer_id !== userId) throw new Error('Access denied');
  if (role === 'citizen' && foundCase.client_id !== userId) throw new Error('Access denied');

  const where = { case_id: caseId };
  if (role === 'citizen') where.is_shared_with_client = true; // citizens only see shared docs
  return await Document.findAll({ where });
}

module.exports = { uploadDocument, getDocumentsForCase };