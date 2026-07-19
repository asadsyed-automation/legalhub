const { addEntry, getEntriesForCase } = require('./entry.service');

async function create(req, res) {
  try {
    const entry = await addEntry({
      caseId: req.body.case_id,
      lawyerId: req.user.id,
      entryText: req.body.entry_text,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForCase(req, res) {
  try {
    const entries = await getEntriesForCase({
      caseId: req.params.caseId,
      userId: req.user.id,
      role: req.user.role,
    });
    res.json(entries);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getForCase };