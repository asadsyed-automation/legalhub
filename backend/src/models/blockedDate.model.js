const { DataTypes, Model } = require('sequelize');

class BlockedDate extends Model {}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Initializes the BlockedDate model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof BlockedDate}
 */
const initBlockedDateModel = (sequelize) => {
  BlockedDate.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      lawyerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          is: {
            args: DATE_REGEX,
            msg: 'date must be in ISO format YYYY-MM-DD'
          }
        }
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'reason cannot exceed 255 characters'
          }
        }
      }
    },
    {
      sequelize,
      tableName: 'blocked_dates',
      modelName: 'BlockedDate',
      timestamps: true,
      indexes: [
        {
          unique: true,
          name: 'blocked_dates_lawyer_date_unique_idx',
          fields: ['lawyerId', 'date']
        }
      ]
    }
  );

  return BlockedDate;
};

module.exports = {
  BlockedDate,
  initBlockedDateModel
};
