const { DataTypes, Model } = require('sequelize');
const { ALLOWED_SERVICE_MODES, SLOT_DURATIONS, FEE_LIMITS } = require('../constants/profile');

class LawyerService extends Model {}

/**
 * Initializes the LawyerService model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof LawyerService}
 */
const initLawyerServiceModel = (sequelize) => {
  LawyerService.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      lawyerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      mode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: {
            args: [ALLOWED_SERVICE_MODES],
            msg: `mode must be one of: ${ALLOWED_SERVICE_MODES.join(', ')}`
          }
        }
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isIn: {
            args: [SLOT_DURATIONS],
            msg: `durationMinutes must be one of: ${SLOT_DURATIONS.join(', ')}`
          }
        }
      },
      feePkr: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: {
            args: [FEE_LIMITS.MIN],
            msg: `feePkr cannot be negative`
          },
          max: {
            args: [FEE_LIMITS.MAX],
            msg: `feePkr cannot exceed ${FEE_LIMITS.MAX}`
          }
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'lawyer_services',
      timestamps: true
    }
  );

  return LawyerService;
};

module.exports = {
  LawyerService,
  initLawyerServiceModel
};
