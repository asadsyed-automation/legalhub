const { addHearing, getHearingsForCase } = require('./hearing.service');

async function create(req, res) {
  try {
    const hearing = await addHearing({
      caseId: req.body.case_id,
      lawyerId: req.user.id,
      hearingDate: req.body.hearing_date,
      notes: req.body.notes,
    });
    res.status(201).json(hearing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForCase(req, res) {
  try {
    const hearings = await getHearingsForCase({
      caseId: req.params.caseId,
      userId: req.user.id,
      role: req.user.role,
    });
    res.json(hearings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getForCase };