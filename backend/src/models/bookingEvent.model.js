const { DataTypes, Model } = require('sequelize');

class BookingEvent extends Model {}

/**
 * Initializes the BookingEvent audit model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof BookingEvent}
 */
const initBookingEventModel = (sequelize) => {
  BookingEvent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        }
      },
      actorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      fromStatus: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      toStatus: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'booking_events',
      modelName: 'BookingEvent',
      timestamps: true,
      updatedAt: false // Only tracks creation timestamp for immutable audit log
    }
  );

  return BookingEvent;
};

module.exports = {
  BookingEvent,
  initBookingEventModel
};
