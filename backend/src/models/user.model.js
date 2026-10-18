const { DataTypes, Model } = require('sequelize');
const { ROLES } = require('../constants/roles');

class User extends Model {
  /**
   * Helper method to serialize user safely without exposing passwordHash.
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }
}

/**
 * Initializes the User model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof User}
 */
const initUserModel = (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
          if (value) {
            this.setDataValue('email', value.trim().toLowerCase());
          }
        },
        validate: {
          isEmail: true
        }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM(ROLES.CLIENT, ROLES.LAWYER, ROLES.ADMIN),
        allowNull: false,
        defaultValue: ROLES.CLIENT
      },
      failedLoginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true
    }
  );

  return User;
};

module.exports = {
  User,
  initUserModel
};
