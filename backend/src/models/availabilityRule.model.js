const { DataTypes, Model } = require('sequelize');
const { WEEKDAY_MIN, WEEKDAY_MAX } = require('../constants/availability');

class AvailabilityRule extends Model {}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Initializes the AvailabilityRule model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof AvailabilityRule}
 */
const initAvailabilityRuleModel = (sequelize) => {
  AvailabilityRule.init(
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
      weekday: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: {
            args: [WEEKDAY_MIN],
            msg: `weekday must be between ${WEEKDAY_MIN} (Monday) and ${WEEKDAY_MAX} (Sunday)`
          },
          max: {
            args: [WEEKDAY_MAX],
            msg: `weekday must be between ${WEEKDAY_MIN} (Monday) and ${WEEKDAY_MAX} (Sunday)`
          }
        }
      },
      startTime: {
        type: DataTypes.STRING(5),
        allowNull: false,
        validate: {
          is: {
            args: TIME_REGEX,
            msg: 'startTime must be formatted as 24-hour time HH:MM (00:00 to 23:59)'
          }
        }
      },
      endTime: {
        type: DataTypes.STRING(5),
        allowNull: false,
        validate: {
          is: {
            args: TIME_REGEX,
            msg: 'endTime must be formatted as 24-hour time HH:MM (00:00 to 23:59)'
          }
        }
      }
    },
    {
      sequelize,
      tableName: 'availability_rules',
      modelName: 'AvailabilityRule',
      timestamps: true,
      indexes: [
        {
          name: 'availability_rules_lawyer_weekday_idx',
          fields: ['lawyerId', 'weekday']
        }
      ]
    }
  );

  return AvailabilityRule;
};

module.exports = {
  AvailabilityRule,
  initAvailabilityRuleModel
};
