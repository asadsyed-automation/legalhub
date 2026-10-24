const { DataTypes, Model } = require('sequelize');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../constants/booking');

class Payment extends Model {}

/**
 * Initializes the Payment model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Payment}
 */
const initPaymentModel = (sequelize) => {
  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'bookings',
          key: 'id'
        }
      },
      amountPkr: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: {
            args: [0],
            msg: 'amountPkr cannot be negative'
          }
        }
      },
      method: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: PAYMENT_METHOD.SANDBOX
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: PAYMENT_STATUS.SUCCEEDED
      },
      reference: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      tableName: 'payments',
      modelName: 'Payment',
      timestamps: true
    }
  );

  return Payment;
};

module.exports = {
  Payment,
  initPaymentModel
};
