'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('enquiries', {
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
      practiceArea: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'submitted'
      },
      lawyerReply: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      repliedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      convertedBookingId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Indexes for fast querying
    await queryInterface.addIndex('enquiries', ['lawyerId', 'status'], {
      name: 'enquiries_lawyer_status_idx'
    });

    await queryInterface.addIndex('enquiries', ['clientId', 'status'], {
      name: 'enquiries_client_status_idx'
    });

    await queryInterface.addIndex('enquiries', ['clientId', 'lawyerId', 'status'], {
      name: 'enquiries_client_lawyer_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('enquiries');
  }
};
