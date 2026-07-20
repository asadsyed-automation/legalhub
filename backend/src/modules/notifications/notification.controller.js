const { getNotificationsForUser, markAsRead } = require('./notification.service');

async function getAll(req, res) {
  try {
    const notifs = await getNotificationsForUser(req.user.id);
    res.json(notifs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function markRead(req, res) {
  try {
    const notif = await markAsRead({ notificationId: req.params.id, userId: req.user.id });
    res.json(notif);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getAll, markRead };