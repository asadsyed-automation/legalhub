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
    type: DataTypes.ENUM('Pending', 'Paid', 'Overdue'),
    allowNull: false,
    defaultValue: 'Pending',
  },
}, {
  tableName: 'fees',
  timestamps: true,
  underscored: true,
});

module.exports = Fee;