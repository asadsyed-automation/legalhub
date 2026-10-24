const { DataTypes, Model } = require('sequelize');
const { LANGUAGES, SLOT_DURATIONS, DEFAULT_SLOT_DURATION } = require('../constants/profile');

class LawyerProfile extends Model {}

/**
 * Initializes the LawyerProfile model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof LawyerProfile}
 */
const initLawyerProfileModel = (sequelize) => {
  LawyerProfile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      headline: {
        type: DataTypes.STRING(120),
        allowNull: true,
        validate: {
          len: [0, 120]
        }
      },
      about: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 2000]
        }
      },
      languages: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: ['Urdu', 'English'],
        validate: {
          isValidLanguages(val) {
            if (!Array.isArray(val) || val.length === 0) {
              throw new Error('At least one language must be specified');
            }
            const invalid = val.filter((lang) => !LANGUAGES.includes(lang));
            if (invalid.length > 0) {
              throw new Error(`Unsupported languages: ${invalid.join(', ')}`);
            }
          }
        }
      },
      slotMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: DEFAULT_SLOT_DURATION,
        validate: {
          isIn: {
            args: [SLOT_DURATIONS],
            msg: `slotMinutes must be one of: ${SLOT_DURATIONS.join(', ')}`
          }
        }
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'lawyer_profiles',
      timestamps: true
    }
  );

  return LawyerProfile;
};

module.exports = {
  LawyerProfile,
  initLawyerProfileModel
};
