const { DataTypes } = require('sequelize');

const OTP_PURPOSES = Object.freeze({
  VERIFY_EMAIL: 'verify_email',
  RESET_PASSWORD: 'reset_password'
});

const initEmailOtpModel = (sequelize) => {
  const EmailOtp = sequelize.define(
    'EmailOtp',
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
      purpose: {
        type: DataTypes.ENUM(...Object.values(OTP_PURPOSES)),
        allowNull: false
      },
      codeHash: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      consumedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'email_otps',
      timestamps: true,
      indexes: [
        {
          fields: ['userId', 'purpose', 'createdAt']
        },
        {
          fields: ['expiresAt']
        }
      ]
    }
  );

  return EmailOtp;
};

module.exports = {
  initEmailOtpModel,
  OTP_PURPOSES
};
