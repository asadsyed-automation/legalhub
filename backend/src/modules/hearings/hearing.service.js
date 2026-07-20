const Hearing = require('./hearing.model');
const Case = require('../cases/case.model');
const { createNotification } = require('../notifications/notification.service');

async function addHearing({ caseId, lawyerId, hearingDate, notes }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');
  if (foundCase.lawyer_id !== lawyerId) throw new Error('Access denied');

  const hearing = await Hearing.create({
    case_id: caseId,
    hearing_date: hearingDate,
    notes: notes || null,
  });

  // Per Aqeel's Task A1: adding a hearing moves case to "Hearing Scheduled"
  foundCase.status = 'Hearing Scheduled';
  await foundCase.save();

  // Notify the client if one is assigned to this case
  if (foundCase.client_id) {
    await createNotification({
      userId: foundCase.client_id,
      type: 'hearing_added',
      message: `A new hearing has been scheduled for case ${foundCase.case_number}`,
    });
  }

  return hearing;
}

async function getHearingsForCase({ caseId, userId, role }) {
  const foundCase = await Case.findByPk(caseId);
  if (!foundCase) throw new Error('Case not found');

  if (role === 'lawyer' && foundCase.lawyer_id !== userId) throw new Error('Access denied');
  if (role === 'citizen' && foundCase.client_id !== userId) throw new Error('Access denied');

  return await Hearing.findAll({ where: { case_id: caseId }, order: [['hearing_date', 'ASC']] });
}

module.exports = { addHearing, getHearingsForCase };