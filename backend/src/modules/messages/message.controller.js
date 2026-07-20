const { sendMessage, getMessagesForCase } = require('./message.service');

async function create(req, res) {
  try {
    const message = await sendMessage({
      caseId: req.body.case_id,
      senderId: req.user.id,
      senderRole: req.user.role,
      messageText: req.body.message_text,
    });

    const io = req.app.get('io');
    io.to(req.body.case_id).emit('new_message', message);

    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getForCase(req, res) {
  try {
    const messages = await getMessagesForCase({ caseId: req.params.caseId, userId: req.user.id, role: req.user.role });
    res.json(messages);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { create, getForCase };