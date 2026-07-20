const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  gig_id: { type: DataTypes.UUID, allowNull: false },
  citizen_id: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true,
});

module.exports = Review;