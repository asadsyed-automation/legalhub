const { z } = require('zod');
const { NOTIFICATION_TYPES } = require('../../constants/notification');

const getNotificationsQuerySchema = z.object({
  page: z
    .preprocess((val) => (val ? parseInt(val, 10) : 1), z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((val) => (val ? parseInt(val, 10) : 20), z.number().int().min(1).max(100))
    .optional()
    .default(20),
  read: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  type: z
    .enum(Object.values(NOTIFICATION_TYPES), {
      errorMap: () => ({
        message: `type must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`
      })
    })
    .optional()
});

const notificationIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Notification ID must be a valid UUID' })
});

module.exports = {
  getNotificationsQuerySchema,
  notificationIdParamSchema
};
