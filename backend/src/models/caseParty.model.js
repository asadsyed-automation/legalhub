const { DataTypes, Model } = require('sequelize');
const { CASE_LIMITS } = require('../constants/case');

class CaseParty extends Model {}

/**
 * Initializes the CaseParty model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof CaseParty}
 */
const initCasePartyModel = (sequelize) => {
  CaseParty.init(
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
      name: {
        type: DataTypes.STRING(CASE_LIMITS.PARTY_NAME_MAX_LENGTH),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Party name cannot be empty' },
          len: {
            args: [1, CASE_LIMITS.PARTY_NAME_MAX_LENGTH],
            msg: `Party name must be between 1 and ${CASE_LIMITS.PARTY_NAME_MAX_LENGTH} characters`
          }
        }
      },
      roleLabel: {
        type: DataTypes.STRING(CASE_LIMITS.ROLE_LABEL_MAX_LENGTH),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Role label cannot be empty' },
          len: {
            args: [1, CASE_LIMITS.ROLE_LABEL_MAX_LENGTH],
            msg: `Role label must be between 1 and ${CASE_LIMITS.ROLE_LABEL_MAX_LENGTH} characters`
          }
        }
      }
    },
    {
      sequelize,
      tableName: 'case_parties',
      modelName: 'CaseParty',
      timestamps: true
    }
  );

  return CaseParty;
};

module.exports = { CaseParty, initCasePartyModel };
