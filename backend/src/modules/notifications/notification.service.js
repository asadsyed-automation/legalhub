const Notification = require('./notification.model');

async function createNotification({ userId, type, message }) {
  return await Notification.create({ user_id: userId, type, message });
}

async function getNotificationsForUser(userId) {
  return await Notification.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
  });
}

async function markAsRead({ notificationId, userId }) {
  const notif = await Notification.findByPk(notificationId);
  if (!notif) throw new Error('Notification not found');
  if (notif.user_id !== userId) throw new Error('Access denied');
  notif.is_read = true;
  await notif.save();
  return notif;
}

module.exports = { createNotification, getNotificationsForUser, markAsRead };