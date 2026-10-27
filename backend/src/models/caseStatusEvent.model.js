const { DataTypes, Model } = require('sequelize');

class CaseStatusEvent extends Model {}

/**
 * Initializes the CaseStatusEvent model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof CaseStatusEvent}
 */
const initCaseStatusEventModel = (sequelize) => {
  CaseStatusEvent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      caseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'id'
        }
      },
      fromStatus: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      toStatus: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      fromStage: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      toStage: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      changedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      sequelize,
      tableName: 'case_status_events',
      modelName: 'CaseStatusEvent',
      timestamps: true,
      updatedAt: false
    }
  );

  return CaseStatusEvent;
};

module.exports = { CaseStatusEvent, initCaseStatusEventModel };
