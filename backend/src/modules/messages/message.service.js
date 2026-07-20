const Message = require('./message.model');
const Case = require('../cases/case.model');
const { createNotification } = require('../notifications/notification.service');

async function sendMessage({ caseId, senderId, senderRole, messageText }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');

  if (senderRole === 'lawyer' && foundCase.lawyer_id !== senderId) throw new Error('Access denied');
  if (senderRole === 'citizen' && foundCase.client_id !== senderId) throw new Error('Access denied');

  const receiverId = senderRole === 'lawyer' ? foundCase.client_id : foundCase.lawyer_id;
  if (!receiverId) throw new Error('No recipient assigned to this case yet');

  const message = await Message.create({
    case_id: caseId,
    sender_id: senderId,
    receiver_id: receiverId,
    message_text: messageText,
  });

  await createNotification({
    userId: receiverId,
    type: 'new_message',
    message: `You have a new message on case ${foundCase.case_number}`,
  });

  return message;
}

async function getMessagesForCase({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (role === 'lawyer' && foundCase.lawyer_id !== userId) throw new Error('Access denied');
  if (role === 'citizen' && foundCase.client_id !== userId) throw new Error('Access denied');

  return await Message.findAll({ where: { case_id: caseId }, order: [['sent_at', 'ASC']] });
}

module.exports = { sendMessage, getMessagesForCase };