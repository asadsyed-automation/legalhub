const { DataTypes, Model } = require('sequelize');
const { ALLOWED_SERVICE_MODES, SLOT_DURATIONS } = require('../constants/profile');
const { ALLOWED_BOOKING_STATUSES, BOOKING_STATUS } = require('../constants/booking');

class Booking extends Model {}

/**
 * Initializes the Booking model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Booking}
 */
const initBookingModel = (sequelize) => {
  Booking.init(
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
      serviceId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'lawyer_services',
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      startUtc: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endUtc: {
        type: DataTypes.DATE,
        allowNull: false
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
            args: [0],
            msg: 'feePkr cannot be negative'
          }
        }
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: BOOKING_STATUS.REQUESTED,
        validate: {
          isIn: {
            args: [ALLOWED_BOOKING_STATUSES],
            msg: `status must be one of: ${ALLOWED_BOOKING_STATUSES.join(', ')}`
          }
        }
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      issueSummary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      clientNotes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      lawyerNotes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      declineReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      cancelReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      cancellationReason: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      sessionInfo: {
        type: DataTypes.STRING(300),
        allowNull: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'bookings',
      modelName: 'Booking',
      timestamps: true,
      indexes: [
        {
          name: 'bookings_lawyer_status_interval_idx',
          fields: ['lawyerId', 'status', 'startUtc', 'endUtc']
        },
        {
          name: 'bookings_client_status_idx',
          fields: ['clientId', 'status']
        },
        {
          name: 'bookings_lawyer_date_idx',
          fields: ['lawyerId', 'date']
        }
      ]
    }
  );

  return Booking;
};

module.exports = {
  Booking,
  initBookingModel
};
