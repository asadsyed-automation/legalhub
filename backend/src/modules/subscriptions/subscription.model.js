const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  plan_type: { type: DataTypes.ENUM('Free', 'Pro', 'Firm'), allowNull: false, defaultValue: 'Free' },
  status: { type: DataTypes.ENUM('Active', 'Expired', 'Cancelled'), allowNull: false, defaultValue: 'Active' },
  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true,
});

module.exports = Subscription;