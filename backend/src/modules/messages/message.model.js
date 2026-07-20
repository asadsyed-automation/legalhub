const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  case_id: { type: DataTypes.UUID, allowNull: false },
  sender_id: { type: DataTypes.UUID, allowNull: false },
  receiver_id: { type: DataTypes.UUID, allowNull: false },
  message_text: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  createdAt: 'sent_at',
  updatedAt: false,
});

module.exports = Message;