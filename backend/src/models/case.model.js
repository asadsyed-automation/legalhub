const { DataTypes, Model } = require('sequelize');
const { CASE_STATUSES, CASE_LIMITS } = require('../constants/case');

class Case extends Model {}

/**
 * Initializes the Case model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Case}
 */
const initCaseModel = (sequelize) => {
  Case.init(
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
      clientId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
        references: {
          model: 'bookings',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING(CASE_LIMITS.TITLE_MAX_LENGTH),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Title cannot be empty' },
          len: {
            args: [3, CASE_LIMITS.TITLE_MAX_LENGTH],
            msg: `Title must be between 3 and ${CASE_LIMITS.TITLE_MAX_LENGTH} characters`
          }
        }
      },
      practiceArea: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Practice area cannot be empty' }
        }
      },
      court: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Court cannot be empty' }
        }
      },
      caseOrFirNumber: {
        type: DataTypes.STRING(CASE_LIMITS.CASE_OR_FIR_MAX_LENGTH),
        allowNull: true
      },
      filingDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Prospect'
      },
      stage: {
        type: DataTypes.STRING(50),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'cases',
      modelName: 'Case',
      timestamps: true
    }
  );

  return Case;
};

module.exports = { Case, initCaseModel };
