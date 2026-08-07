const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/auth.model');

const MarketplaceProfile = sequelize.define('MarketplaceProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  lawyer_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  specialization: { type: DataTypes.STRING, allowNull: false },
  fee_structure: { type: DataTypes.STRING, allowNull: true },
  cases_won: { type: DataTypes.INTEGER, defaultValue: 0 },
  avatar_url: { type: DataTypes.STRING, allowNull: true },
  whatsapp_number: { type: DataTypes.STRING, allowNull: true },
  linkedin_url: { type: DataTypes.STRING, allowNull: true },
  twitter_url: { type: DataTypes.STRING, allowNull: true },
  website_url: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, defaultValue: 'Lahore' },
  court_level: { type: DataTypes.STRING, defaultValue: 'High Court Advocate' },
  rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'marketplace_profiles',
  timestamps: true,
  underscored: true,
});

if (!MarketplaceProfile.associations || !MarketplaceProfile.associations.lawyer) {
  MarketplaceProfile.belongsTo(User, { foreignKey: 'lawyer_id', as: 'lawyer' });
}

module.exports = MarketplaceProfile;