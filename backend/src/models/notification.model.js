const { DataTypes, Model } = require('sequelize');
const { NOTIFICATION_TYPES, EMAIL_STATUSES } = require('../constants/notification');

class Notification extends Model {}

/**
 * Initializes the Notification model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Notification}
 */
const initNotificationModel = (sequelize) => {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(NOTIFICATION_TYPES)],
            msg: `Notification type must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`
          }
        }
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Notification title cannot be empty' },
          len: {
            args: [1, 255],
            msg: 'Notification title cannot exceed 255 characters'
          }
        }
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Notification body cannot be empty' }
        }
      },
      link: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: 'Notification link cannot exceed 500 characters'
          }
        }
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      emailStatus: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: EMAIL_STATUSES.SKIPPED,
        validate: {
          isIn: {
            args: [Object.values(EMAIL_STATUSES)],
            msg: `Email status must be one of: ${Object.values(EMAIL_STATUSES).join(', ')}`
          }
        }
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'notifications',
      modelName: 'Notification',
      timestamps: true,
      indexes: [
        {
          fields: ['userId', 'readAt'],
          name: 'notifications_user_id_read_at_idx'
        },
        {
          fields: ['userId', 'createdAt'],
          name: 'notifications_user_id_created_at_idx'
        },
        {
          fields: ['userId', 'type'],
          name: 'notifications_user_id_type_idx'
        }
      ]
    }
  );

  return Notification;
};

module.exports = {
  Notification,
  initNotificationModel
};
