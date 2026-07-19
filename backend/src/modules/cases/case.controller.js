const { createCase, getCasesForUser, getCaseById } = require('./case.service');

async function create(req, res) {
  try {
    const newCase = await createCase({
      lawyerId: req.user.id,
      clientId: req.body.client_id,
      caseNumber: req.body.case_number,
      courtName: req.body.court_name,
      caseType: req.body.case_type,
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