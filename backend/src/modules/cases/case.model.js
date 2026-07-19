const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { CASE_STATUSES, CASE_TYPES } = require('../../constants/case.constants');

const Case = sequelize.define('Case', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lawyer_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: true, // nullable — consultation stage, no formal client yet
  },
  case_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  court_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  case_type: {
    type: DataTypes.ENUM(...CASE_TYPES),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...CASE_STATUSES),
    allowNull: false,
    defaultValue: 'Open',
  },
}, {
  tableName: 'cases',
  timestamps: true,
  underscored: true,
});

module.exports = Case;