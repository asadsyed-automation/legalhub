const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Fee = sequelize.define('Fee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  case_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Pending_Verification', 'Paid', 'Rejected', 'Overdue'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  receipt_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'fees',
  timestamps: true,
  underscored: true,
});

module.exports = Fee;