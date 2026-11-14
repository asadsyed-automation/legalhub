const { DataTypes, Model } = require('sequelize');

class FirmMember extends Model {}

/**
 * Initializes the FirmMember model on the provided Sequelize instance.
 * Represents an associate advocate/lawyer working under a Law Firm chamber.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof FirmMember}
 */
const initFirmMemberModel = (sequelize) => {
  FirmMember.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      firmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
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
      designation: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Associate Advocate',
        validate: {
          notEmpty: { msg: 'Designation cannot be empty' },
          len: {
            args: [2, 100],
            msg: 'Designation must be between 2 and 100 characters'
          }
        }
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'active',
        validate: {
          isIn: {
            args: [['active', 'inactive']],
            msg: 'Status must be active or inactive'
          }
        }
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'firm_members',
      modelName: 'FirmMember',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['firmId', 'lawyerId'],
          name: 'firm_members_firm_lawyer_unique'
        },
        {
          fields: ['lawyerId'],
          name: 'firm_members_lawyer_idx'
        }
      ]
    }
  );

  return FirmMember;
};

module.exports = { FirmMember, initFirmMemberModel };

