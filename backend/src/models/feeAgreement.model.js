const { DataTypes, Model } = require('sequelize');
const { FEE_AGREEMENT_TYPES, FEE_LIMITS } = require('../constants/case');

class FeeAgreement extends Model {}

/**
 * Initializes the FeeAgreement model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof FeeAgreement}
 */
const initFeeAgreementModel = (sequelize) => {
  FeeAgreement.init(
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
        unique: true,
        references: {
          model: 'cases',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
          isIn: {
            args: [FEE_AGREEMENT_TYPES],
            msg: `Agreement type must be one of: ${FEE_AGREEMENT_TYPES.join(', ')}`
          }
        }
      },
      agreedAmountPkr: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isInt: { msg: 'Agreed amount must be an integer' },
          min: {
            args: [FEE_LIMITS.MIN_AGREED_AMOUNT_PKR],
            msg: `Agreed amount cannot be less than ${FEE_LIMITS.MIN_AGREED_AMOUNT_PKR} PKR`
          },
          max: {
            args: [FEE_LIMITS.MAX_FEE_PKR],
            msg: `Agreed amount cannot exceed ${FEE_LIMITS.MAX_FEE_PKR} PKR`
          }
        }
      },
      notes: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          len: {
            args: [0, FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH],
            msg: `Notes cannot exceed ${FEE_LIMITS.MAX_AGREEMENT_NOTES_LENGTH} characters`
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'FeeAgreement',
      tableName: 'fee_agreements',
      timestamps: true
    }
  );

  return FeeAgreement;
};

module.exports = {
  FeeAgreement,
  initFeeAgreementModel
};
