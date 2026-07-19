const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const CaseEntry = sequelize.define('CaseEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  case_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  entry_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ai_summary: {
    type: DataTypes.TEXT,
    allowNull: true, // filled later once AI service is connected (Phase 10)
  },
}, {
  tableName: 'case_entries',
  timestamps: true,
  underscored: true,
});

module.exports = CaseEntry;