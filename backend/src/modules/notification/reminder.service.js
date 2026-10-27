const { Op } = require('sequelize');
const { Hearing, Case, Notification, sequelize } = require('../../models');
const { NOTIFICATION_TYPES, REMINDER_MILESTONES } = require('../../constants/notification');
const { createNotification } = require('./notification.service');

/**
 * Calculates milestone trigger timestamps in UTC for a hearing scheduled at scheduledAt.
 * Milestones evaluated in Pakistan Standard Time (PKT / UTC+5):
 * - 3_days_prior: 3 days before scheduled date at 09:00 AM PKT (04:00 AM UTC)
 * - night_before: 1 day before scheduled date at 08:00 PM (20:00) PKT (15:00 UTC)
 * - morning_of: On scheduled date at 07:00 AM PKT (02:00 AM UTC)
 *
 * @param {Date|string} scheduledAt
 * @returns {{ '3_days_prior': Date, 'night_before': Date, 'morning_of': Date }}
 */
const calculateMilestoneTimestamps = (scheduledAt) => {
  const hearingUtc = new Date(scheduledAt);
  // Shift to PKT (UTC + 5 hours) to extract the PKT calendar date
  const pktDate = new Date(hearingUtc.getTime() + 5 * 60 * 60 * 1000);
  const year = pktDate.getUTCFullYear();
  const month = pktDate.getUTCMonth();
  const day = pktDate.getUTCDate();

  // 1. 3 Days Prior at 09:00 PKT -> 04:00 UTC
  const threeDaysPriorUtc = new Date(Date.UTC(year, month, day - 3, 4, 0, 0));

  // 2. Night Before at 20:00 PKT -> 15:00 UTC
  const nightBeforeUtc = new Date(Date.UTC(year, month, day - 1, 15, 0, 0));

  // 3. Morning Of at 07:00 PKT -> 02:00 UTC
  const morningOfUtc = new Date(Date.UTC(year, month, day, 2, 0, 0));

  return {
    [REMINDER_MILESTONES.THREE_DAYS_PRIOR]: threeDaysPriorUtc,
    [REMINDER_MILESTONES.NIGHT_BEFORE]: nightBeforeUtc,
    [REMINDER_MILESTONES.MORNING_OF]: morningOfUtc
  };
};

/**
 * Checks whether a notification for this recipient, hearing, and milestone has already been dispatched.
 *
 * @param {string} userId
 * @param {string} hearingId
 * @param {string} milestone
 * @returns {Promise<boolean>}
 */
const hasReminderBeenSent = async (userId, hearingId, milestone) => {
  const existing = await Notification.findOne({
    where: {
      userId,
      type: NOTIFICATION_TYPES.HEARING_REMINDER,
      [Op.and]: [
        sequelize.where(
          sequelize.literal("metadata->>'hearingId'"),
          hearingId
        ),
        sequelize.where(
          sequelize.literal("metadata->>'milestone'"),
          milestone
        )
      ]
    }
  });

  return Boolean(existing);
};

/**
 * Formats a hearing reminder subject and body for a lawyer or client.
 */
const buildReminderContent = (milestone, hearing, caseFile, recipientRole) => {
  const courtText = hearing.court || 'Court';
  const stageText = hearing.stage ? ` (${hearing.stage})` : '';

  let milestonePrefix = '';
  if (milestone === REMINDER_MILESTONES.THREE_DAYS_PRIOR) {
    milestonePrefix = 'Upcoming Hearing in 3 Days';
  } else if (milestone === REMINDER_MILESTONES.NIGHT_BEFORE) {
    milestonePrefix = 'Hearing Tomorrow';
  } else if (milestone === REMINDER_MILESTONES.MORNING_OF) {
    milestonePrefix = 'Hearing Today';
  }

  const title = `${milestonePrefix}: ${caseFile.title} at ${courtText}`;

  let body = '';
  if (recipientRole === 'client') {
    const explanation = hearing.clientExplanation
      ? ` Note from counsel: "${hearing.clientExplanation}".`
      : '';
    body = `Your case "${caseFile.title}" has a scheduled hearing at ${courtText}${stageText} on ${new Date(
      hearing.scheduledAt
    ).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} PKT.${explanation}`;
  } else {
    const noteText = hearing.note ? ` Chamber note: ${hearing.note}.` : '';
    body = `Case hearing scheduled for "${caseFile.title}" at ${courtText}${stageText} on ${new Date(
      hearing.scheduledAt
    ).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} PKT.${noteText}`;
  }

  return { title, body };
};

/**
 * Pure, deterministic reminder sweep function.
 * Evaluates active upcoming hearings against Pakistan Standard Time reminder windows.
 *
 * @param {Date} [now=new Date()] - The evaluation clock time
 * @returns {Promise<{ evaluatedHearings: number, remindersSent: number, timestamp: string }>}
 */
const runReminderSweep = async (now = new Date()) => {
  const currentNow = new Date(now);

  // Look ahead up to 5 days to cover the 3-day reminder horizon
  const maxHorizon = new Date(currentNow.getTime() + 5 * 24 * 60 * 60 * 1000);

  const upcomingHearings = await Hearing.findAll({
    where: {
      scheduledAt: {
        [Op.gt]: currentNow,
        [Op.lte]: maxHorizon
      }
    },
    include: [
      {
        model: Case,
        as: 'case',
        attributes: ['id', 'lawyerId', 'clientId', 'title', 'court', 'caseOrFirNumber']
      }
    ]
  });

  let remindersSent = 0;

  for (const hearing of upcomingHearings) {
    const caseFile = hearing.case;
    if (!caseFile) continue;

    const milestones = calculateMilestoneTimestamps(hearing.scheduledAt);

    for (const [milestone, triggerTime] of Object.entries(milestones)) {
      // Must be past or at the trigger time, but strictly before the hearing starts
      if (currentNow >= triggerTime && currentNow < new Date(hearing.scheduledAt)) {
        // 1. Send reminder to assigned advocate
        const lawyerAlreadySent = await hasReminderBeenSent(caseFile.lawyerId, hearing.id, milestone);
        if (!lawyerAlreadySent) {
          const { title, body } = buildReminderContent(milestone, hearing, caseFile, 'lawyer');
          await createNotification({
            userId: caseFile.lawyerId,
            type: NOTIFICATION_TYPES.HEARING_REMINDER,
            title,
            body,
            link: `/cases/${caseFile.id}`,
            sendEmail: true,
            emailSubject: title,
            metadata: {
              hearingId: hearing.id,
              caseId: caseFile.id,
              milestone,
              recipientRole: 'lawyer'
            }
          });
          remindersSent += 1;
        }

        // 2. Send reminder to linked client (ONLY if hearing is shared)
        if (hearing.visibility === 'shared' && caseFile.clientId) {
          const clientAlreadySent = await hasReminderBeenSent(caseFile.clientId, hearing.id, milestone);
          if (!clientAlreadySent) {
            const { title, body } = buildReminderContent(milestone, hearing, caseFile, 'client');
            await createNotification({
              userId: caseFile.clientId,
              type: NOTIFICATION_TYPES.HEARING_REMINDER,
              title,
              body,
              link: `/cases/${caseFile.id}`,
              sendEmail: true,
              emailSubject: title,
              metadata: {
                hearingId: hearing.id,
                caseId: caseFile.id,
                milestone,
                recipientRole: 'client'
              }
            });
            remindersSent += 1;
          }
        }
      }
    }
  }

  return {
    evaluatedHearings: upcomingHearings.length,
    remindersSent,
    timestamp: currentNow.toISOString()
  };
};

module.exports = {
  calculateMilestoneTimestamps,
  hasReminderBeenSent,
  runReminderSweep
};
