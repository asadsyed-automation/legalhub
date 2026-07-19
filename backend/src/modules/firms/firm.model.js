const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Firm = sequelize.define('Firm', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'firms',
  timestamps: true,
  underscored: true,
});

module.exports = Firm;