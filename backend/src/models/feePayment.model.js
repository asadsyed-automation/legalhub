const { DataTypes, Model } = require('sequelize');
const { FEE_PAYMENT_METHODS, FEE_LIMITS } = require('../constants/case');

class FeePayment extends Model {}

/**
 * Initializes the FeePayment model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof FeePayment}
 */
const initFeePaymentModel = (sequelize) => {
  FeePayment.init(
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
      amountPkr: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'Payment amount must be an integer' },
          min: {
            args: [FEE_LIMITS.MIN_PAYMENT_PKR],
            msg: `Payment amount must be at least ${FEE_LIMITS.MIN_PAYMENT_PKR} PKR`
          },
          max: {
            args: [FEE_LIMITS.MAX_FEE_PKR],
            msg: `Payment amount cannot exceed ${FEE_LIMITS.MAX_FEE_PKR} PKR`
          }
        }
      },
      method: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
          isIn: {
            args: [FEE_PAYMENT_METHODS],
            msg: `Payment method must be one of: ${FEE_PAYMENT_METHODS.join(', ')}`
          }
        }
      },
      reference: {
        type: DataTypes.STRING(60),
        allowNull: true,
        validate: {
          len: {
            args: [0, FEE_LIMITS.MAX_PAYMENT_REF_LENGTH],
            msg: `Payment reference cannot exceed ${FEE_LIMITS.MAX_PAYMENT_REF_LENGTH} characters`
          }
        }
      },
      paidOn: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Payment date is required' },
          isDate: { msg: 'paidOn must be a valid date' }
        }
      },
      note: {
        type: DataTypes.STRING(300),
        allowNull: true,
        validate: {
          len: {
            args: [0, FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH],
            msg: `Note cannot exceed ${FEE_LIMITS.MAX_PAYMENT_NOTE_LENGTH} characters`
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'FeePayment',
      tableName: 'fee_payments',
      timestamps: true
    }
  );

  return FeePayment;
};

module.exports = {
  FeePayment,
  initFeePaymentModel
};
