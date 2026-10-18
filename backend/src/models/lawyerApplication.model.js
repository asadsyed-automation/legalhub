const { DataTypes, Model } = require('sequelize');
const { APPLICATION_STATUS } = require('../constants');

class LawyerApplication extends Model {}

/**
 * Initializes the LawyerApplication model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof LawyerApplication}
 */
const initLawyerApplicationModel = (sequelize) => {
  LawyerApplication.init(
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
        unique: true
      },
      barCouncil: {
        type: DataTypes.STRING,
        allowNull: false
      },
      enrolmentNo: {
        type: DataTypes.STRING,
        allowNull: false
      },
      courtLevel: {
        type: DataTypes.STRING,
        allowNull: false
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false
      },
      practiceAreas: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
      },
      experienceYears: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      chamberAddress: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          APPLICATION_STATUS.PENDING,
          APPLICATION_STATUS.APPROVED,
          APPLICATION_STATUS.REJECTED
        ),
        allowNull: false,
        defaultValue: APPLICATION_STATUS.PENDING
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'LawyerApplication',
      tableName: 'lawyer_applications',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['barCouncil', 'enrolmentNo']
        }
      ]
    }
  );

  return LawyerApplication;
};

module.exports = {
  LawyerApplication,
  initLawyerApplicationModel
};
