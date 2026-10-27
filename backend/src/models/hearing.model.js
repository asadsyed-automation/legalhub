const { DataTypes, Model } = require('sequelize');
const { ENTRY_VISIBILITIES } = require('../constants/case');

class Hearing extends Model {}

/**
 * Initializes the Hearing model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Hearing}
 */
const initHearingModel = (sequelize) => {
  Hearing.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      caseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'id'
        }
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Scheduled hearing date/time is required' },
          isDate: { msg: 'Scheduled hearing date/time must be valid' }
        }
      },
      court: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Court cannot be empty' },
          len: {
            args: [2, 255],
            msg: 'Court must be between 2 and 255 characters'
          }
        }
      },
      bench: {
        type: DataTypes.STRING(120),
        allowNull: true,
        validate: {
          len: {
            args: [0, 120],
            msg: 'Bench cannot exceed 120 characters'
          }
        }
      },
      stage: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      outcome: {
        type: DataTypes.STRING(300),
        allowNull: true,
        validate: {
          len: {
            args: [0, 300],
            msg: 'Outcome cannot exceed 300 characters'
          }
        }
      },
      nextDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      adjournmentReason: {
        type: DataTypes.STRING(300),
        allowNull: true,
        validate: {
          len: {
            args: [0, 300],
            msg: 'Adjournment reason cannot exceed 300 characters'
          }
        }
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Private note cannot exceed 2000 characters'
          }
        }
      },
      clientExplanation: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 1000],
            msg: 'Client explanation cannot exceed 1000 characters'
          }
        }
      },
      visibility: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'shared',
        validate: {
          isIn: {
            args: [ENTRY_VISIBILITIES],
            msg: `Visibility must be one of: ${ENTRY_VISIBILITIES.join(', ')}`
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'Hearing',
      tableName: 'hearings',
      timestamps: true
    }
  );

  return Hearing;
};

module.exports = {
  Hearing,
  initHearingModel
};
