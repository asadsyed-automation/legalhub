const { DataTypes, Model } = require('sequelize');

class ConsultationNote extends Model {}

/**
 * Initializes the ConsultationNote model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof ConsultationNote}
 */
const initConsultationNoteModel = (sequelize) => {
  ConsultationNote.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'bookings',
          key: 'id'
        }
      },
      lawyerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      actionItems: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      privateNotes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'consultation_notes',
      modelName: 'ConsultationNote',
      timestamps: true
    }
  );

  return ConsultationNote;
};

module.exports = {
  ConsultationNote,
  initConsultationNoteModel
};
