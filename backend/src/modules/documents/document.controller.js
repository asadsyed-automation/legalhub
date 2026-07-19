const { uploadDocument, getDocumentsForCase } = require('./document.service');

async function create(req, res) {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const doc = await uploadDocument({
      caseId: req.body.case_id,
      uploadedBy: req.user.id,
      fileUrl: req.file.path,
      isShared: req.body.is_shared_with_client === 'true',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForCase(req, res) {
  try {
    const docs = await getDocumentsForCase({ caseId: req.params.caseId, userId: req.user.id, role: req.user.role });
    res.json(docs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getForCase };