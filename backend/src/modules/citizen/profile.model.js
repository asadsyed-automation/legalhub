const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/auth.model');

const CitizenProfile = sequelize.define('CitizenProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  citizen_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  phone_number: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Lahore' },
  legal_summary: { type: DataTypes.TEXT, allowNull: true },
  preferred_specialization: { type: DataTypes.STRING, allowNull: true, defaultValue: 'General Legal Assistance' },
  budget_range: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Flexible' },
  avatar_url: { type: DataTypes.STRING, allowNull: true },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'citizen_profiles',
  timestamps: true,
  underscored: true,
});

if (!CitizenProfile.associations || !CitizenProfile.associations.citizen) {
  CitizenProfile.belongsTo(User, { foreignKey: 'citizen_id', as: 'citizen' });
}

module.exports = CitizenProfile;
