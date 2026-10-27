const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const verifyToken = require('../../middleware/verifyToken');
const validate = require('../../middleware/validate');
const {
  getNotificationsQuerySchema,
  notificationIdParamSchema
} = require('./notification.schemas');

// All notification endpoints require authenticated user
router.use(verifyToken);

router.get(
  '/',
  validate({ query: getNotificationsQuerySchema }),
  notificationController.getNotifications
);

router.get(
  '/unread-count',
  notificationController.getUnreadCount
);

router.patch(
  '/read-all',
  notificationController.markAllAsRead
);

router.patch(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  notificationController.markAsRead
);

module.exports = router;
