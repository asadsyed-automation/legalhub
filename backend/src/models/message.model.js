const { DataTypes, Model } = require('sequelize');

class Message extends Model {}

/**
 * Initializes the Message model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Message}
 */
const initMessageModel = (sequelize) => {
  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id'
        }
      },
      caseId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'cases',
          key: 'id'
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Message content cannot be empty' },
          len: {
            args: [1, 2000],
            msg: 'Message content cannot exceed 2000 characters'
          }
        }
      },
      attachments: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'messages',
      modelName: 'Message',
      timestamps: true,
      validate: {
        eitherBookingOrCase() {
          if (this.bookingId === undefined && this.caseId === undefined) {
            return;
          }
          if (!this.bookingId && !this.caseId) {
            throw new Error('Message must be linked to either a booking or a case file');
          }
        }
      },


      indexes: [
        {
          fields: ['bookingId', 'createdAt'],
          name: 'messages_booking_id_created_at_idx'
        },
        {
          fields: ['caseId', 'createdAt'],
          name: 'messages_case_id_created_at_idx'
        },
        {
          fields: ['senderId', 'createdAt'],
          name: 'messages_sender_id_created_at_idx'
        }
      ]
    }
  );

  return Message;
};

module.exports = {
  Message,
  initMessageModel
};
