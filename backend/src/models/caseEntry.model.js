const { DataTypes, Model } = require('sequelize');
const { CASE_ENTRY_TYPES, ENTRY_VISIBILITIES } = require('../constants/case');

class CaseEntry extends Model {}

/**
 * Initializes the CaseEntry model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof CaseEntry}
 */
const initCaseEntryModel = (sequelize) => {
  CaseEntry.init(
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
      entryDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Entry date is required' },
          isDate: { msg: 'Entry date must be a valid date' }
        }
      },
      entryType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
          isIn: {
            args: [CASE_ENTRY_TYPES],
            msg: `Entry type must be one of: ${CASE_ENTRY_TYPES.join(', ')}`
          }
        }
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Title cannot be empty' },
          len: {
            args: [2, 150],
            msg: 'Title must be between 2 and 150 characters'
          }
        }
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Body cannot be empty' },
          len: {
            args: [1, 5000],
            msg: 'Body cannot exceed 5000 characters'
          }
        }
      },
      visibility: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'private',
        validate: {
          isIn: {
            args: [ENTRY_VISIBILITIES],
            msg: `Visibility must be one of: ${ENTRY_VISIBILITIES.join(', ')}`
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'CaseEntry',
      tableName: 'case_entries',
      timestamps: true
    }
  );

  return CaseEntry;
};

module.exports = {
  CaseEntry,
  initCaseEntryModel
};
