const { Op } = require('sequelize');
const { Notification, User } = require('../../models');
const { NOTIFICATION_TYPES, EMAIL_STATUSES } = require('../../constants/notification');
const { sendEmail } = require('../../utils/mailer');
const AppError = require('../../utils/AppError');

/**
 * Creates and persists a notification, optionally dispatching an email alert.
 *
 * @param {Object} params
 * @param {string} params.userId - Recipient user UUID
 * @param {string} params.type - One of NOTIFICATION_TYPES
 * @param {string} params.title - Notification headline
 * @param {string} params.body - Detailed notification body
 * @param {string} [params.link] - Optional action link (e.g. /cases/:id)
 * @param {boolean} [params.sendEmail=false] - Whether to send an email
 * @param {string} [params.emailSubject] - Optional custom email subject
 * @param {string} [params.emailHtml] - Optional HTML email body
 * @param {string} [params.emailText] - Optional plain-text email body
 * @param {Object} [params.metadata] - Optional arbitrary metadata object
 * @returns {Promise<Notification>}
 */
const createNotification = async ({
  userId,
  type,
  title,
  body,
  link = null,
  sendEmail: shouldSendEmail = false,
  emailSubject = null,
  emailHtml = null,
  emailText = null,
  metadata = null
}) => {
  let emailStatus = EMAIL_STATUSES.SKIPPED;

  if (shouldSendEmail) {
    const recipient = await User.findByPk(userId, { attributes: ['id', 'email', 'name'] });
    if (recipient && recipient.email) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: emailSubject || title,
          text: emailText || body,
          html: emailHtml || `<p>${body}</p>`
        });
        emailStatus = EMAIL_STATUSES.SENT;
      } catch (err) {
        console.error(`[NOTIFICATION_SERVICE] Email delivery failed for user ${userId}:`, err.message);
        emailStatus = EMAIL_STATUSES.FAILED;
      }
    }
  }

  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    link,
    readAt: null,
    emailStatus,
    metadata
  });

  return notification;
};

/**
 * Retrieves paginated notifications for the authenticated user.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {Object} query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=20]
 * @param {boolean} [query.read]
 * @param {string} [query.type]
 * @returns {Promise<{ notifications: Notification[], pagination: Object }>}
 */
const getNotifications = async (userId, { page = 1, limit = 20, read, type } = {}) => {
  const where = { userId };

  if (read === true) {
    where.readAt = { [Op.ne]: null };
  } else if (read === false) {
    where.readAt = null;
  }

  if (type) {
    where.type = type;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  const totalPages = Math.ceil(count / limit) || 1;

  return {
    notifications: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages
    }
  };
};

/**
 * Marks a single notification as read if owned by the user.
 *
 * @param {string} notificationId - Notification UUID
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<Notification>}
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findByPk(notificationId);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== userId) {
    throw new AppError('Forbidden: You do not own this notification', 403);
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

/**
 * Marks all unread notifications for a user as read.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ updatedCount: number }>}
 */
const markAllAsRead = async (userId) => {
  const [updatedCount] = await Notification.update(
    { readAt: new Date() },
    {
      where: {
        userId,
        readAt: null
      }
    }
  );

  return { updatedCount };
};

/**
 * Returns the unread notification count for a user.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ count: number }>}
 */
const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: {
      userId,
      readAt: null
    }
  });

  return { count };
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
