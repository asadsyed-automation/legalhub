const { createCase, getCasesForUser, getCaseById, updateCaseStatus } = require('./case.service');

async function create(req, res) {
  try {
    const isCitizen = req.user.role === 'citizen';
    const lawyerId = isCitizen ? req.body.lawyer_id : req.user.id;
    const clientId = isCitizen ? req.user.id : req.body.client_id;

    if (!lawyerId) throw new Error('Target lawyer ID is required');

    const newCase = await createCase({
      lawyerId,
      clientId,
      caseNumber: req.body.case_number || ('LH-' + Math.floor(100000 + Math.random() * 900000)),
      courtName: req.body.court_name || 'High Court / District Court',
      caseType: req.body.case_type || 'Civil',
    });
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAll(req, res) {
  try {
    const cases = await getCasesForUser({ userId: req.user.id, role: req.user.role });
    res.json(cases);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const foundCase = await getCaseById({
      caseId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });
    res.json(foundCase);
  } catch (err) {
    const status = err.message === 'Access denied' ? 403 : 404;
    res.status(status).json({ error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const updated = await updateCaseStatus({
      caseId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      newStatus: req.body.status,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getAll, getOne, updateStatus };