const { DataTypes, Model } = require('sequelize');
const { ENGAGEMENT_STATUS, ALLOWED_ENGAGEMENT_STATUSES } = require('../constants/engagement');

class Engagement extends Model {}

/**
 * Initializes the Engagement model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Engagement}
 */
const initEngagementModel = (sequelize) => {
  Engagement.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      lawyerId: {
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
      title: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Title cannot be empty' },
          len: {
            args: [3, 120],
            msg: 'Title must be between 3 and 120 characters'
          }
        }
      },
      practiceArea: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Practice area cannot be empty' }
        }
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: ENGAGEMENT_STATUS.ACTIVE,
        validate: {
          isIn: {
            args: [ALLOWED_ENGAGEMENT_STATUSES],
            msg: `Status must be one of: ${ALLOWED_ENGAGEMENT_STATUSES.join(', ')}`
          }
        }
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      closedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'engagements',
      modelName: 'Engagement',
      timestamps: true
    }
  );

  return Engagement;
};

module.exports = {
  Engagement,
  initEngagementModel
};
