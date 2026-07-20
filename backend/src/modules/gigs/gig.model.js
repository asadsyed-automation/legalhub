const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Gig = sequelize.define('Gig', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  profile_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, {
  tableName: 'gigs',
  timestamps: true,
  underscored: true,
});

module.exports = Gig;