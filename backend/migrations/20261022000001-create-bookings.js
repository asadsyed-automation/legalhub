'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lawyerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      serviceId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'lawyer_services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      mode: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      startUtc: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endUtc: {
        type: Sequelize.DATE,
        allowNull: false
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      feePkr: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending'
      },
      clientNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lawyerNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cancellationReason: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add composite index for lawyer conflict detection & schedule queries
    await queryInterface.addIndex('bookings', ['lawyerId', 'status', 'startUtc', 'endUtc'], {
      name: 'bookings_lawyer_status_interval_idx'
    });

    // Add index for client appointment dashboard lookups
    await queryInterface.addIndex('bookings', ['clientId', 'status'], {
      name: 'bookings_client_status_idx'
    });

    // Add index for date-based schedule lookups
    await queryInterface.addIndex('bookings', ['lawyerId', 'date'], {
      name: 'bookings_lawyer_date_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bookings');
  }
};
