const { DataTypes, Model } = require('sequelize');
const { ENQUIRY_STATUS, ALLOWED_ENQUIRY_STATUSES } = require('../constants/enquiry');
const { PRACTICE_AREAS } = require('../constants');

class Enquiry extends Model {}

/**
 * Initializes the Enquiry model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Enquiry}
 */
const initEnquiryModel = (sequelize) => {
  Enquiry.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      clientId: {
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
      practiceArea: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [PRACTICE_AREAS],
            msg: `practiceArea must be one of: ${PRACTICE_AREAS.join(', ')}`
          }
        }
      },
      subject: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: {
          len: {
            args: [5, 120],
            msg: 'subject must be between 5 and 120 characters'
          }
        }
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: {
            args: [10, 2000],
            msg: 'message must be between 10 and 2000 characters'
          }
        }
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: ENQUIRY_STATUS.SUBMITTED,
        validate: {
          isIn: {
            args: [ALLOWED_ENQUIRY_STATUSES],
            msg: `status must be one of: ${ALLOWED_ENQUIRY_STATUSES.join(', ')}`
          }
        }
      },
      lawyerReply: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      repliedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      convertedBookingId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id'
        }
      }
    },
    {
      sequelize,
      tableName: 'enquiries',
      modelName: 'Enquiry',
      timestamps: true,
      indexes: [
        {
          name: 'enquiries_lawyer_status_idx',
          fields: ['lawyerId', 'status']
        },
        {
          name: 'enquiries_client_status_idx',
          fields: ['clientId', 'status']
        },
        {
          name: 'enquiries_client_lawyer_status_idx',
          fields: ['clientId', 'lawyerId', 'status']
        }
      ]
    }
  );

  return Enquiry;
};

module.exports = {
  Enquiry,
  initEnquiryModel
};
