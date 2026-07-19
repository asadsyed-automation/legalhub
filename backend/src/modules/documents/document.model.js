const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Document = sequelize.define('Document', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  case_id: { type: DataTypes.UUID, allowNull: false },
  uploaded_by: { type: DataTypes.UUID, allowNull: false },
  file_url: { type: DataTypes.STRING, allowNull: false },
  is_shared_with_client: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
});

module.exports = Document;