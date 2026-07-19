const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Hearing = sequelize.define('Hearing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  case_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  hearing_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'hearings',
  timestamps: true,
  underscored: true,
});

module.exports = Hearing;