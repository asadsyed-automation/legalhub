const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const MarketplaceProfile = sequelize.define('MarketplaceProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  lawyer_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  specialization: { type: DataTypes.STRING, allowNull: false },
  fee_structure: { type: DataTypes.STRING, allowNull: true },
  cases_won: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'marketplace_profiles',
  timestamps: true,
  underscored: true,
});

module.exports = MarketplaceProfile;